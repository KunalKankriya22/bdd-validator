import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { BatchNotesDialog, BatchNotesDialogData } from './batch-notes-dialog';
import { TestBatchDetailsApiService } from '../../services/test-batch-details-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { BatchNoteDto } from '../../models/test-batch-details.model';

describe('BatchNotesDialog', () => {
  let component: BatchNotesDialog;
  let fixture: ComponentFixture<BatchNotesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BatchNotesDialog>>;
  let apiServiceSpy: jasmine.SpyObj<TestBatchDetailsApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let loggingSpy: jasmine.SpyObj<LoggingService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const mockNotes: BatchNoteDto[] = [
    { auditKey: 1, note: 'First note', createdDate: '2024-06-15T10:00:00', createdBy: 'user1' } as any,
    { auditKey: 2, note: 'Second note', createdDate: '2024-06-16T11:00:00', createdBy: 'user2' } as any,
  ];

  const defaultDialogData: BatchNotesDialogData = {
    worksheetId: 'WS001',
    testId: 'T001',
  };

  function createComponent(data: BatchNotesDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('TestBatchDetailsApiService', [
      'getNotes', 'addNote', 'updateNote', 'deleteNote',
    ]);
    apiServiceSpy.getNotes.and.returnValue(of(mockNotes));
    apiServiceSpy.addNote.and.returnValue(of(mockNotes));
    apiServiceSpy.updateNote.and.returnValue(of(mockNotes));
    apiServiceSpy.deleteNote.and.returnValue(of(undefined));

    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    loggingSpy = jasmine.createSpyObj('LoggingService', ['error']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [BatchNotesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: TestBatchDetailsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
    });

    fixture = TestBed.createComponent(BatchNotesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load notes on construction', () => {
    expect(apiServiceSpy.getNotes).toHaveBeenCalledWith('WS001');
    expect(component.notes().length).toBe(2);
  });

  it('should set loading to false after notes load', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should handle error when loading notes fails', () => {
    TestBed.resetTestingModule();
    apiServiceSpy = jasmine.createSpyObj('TestBatchDetailsApiService', [
      'getNotes', 'addNote', 'updateNote', 'deleteNote',
    ]);
    apiServiceSpy.getNotes.and.returnValue(throwError(() => new Error('fail')));
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    loggingSpy = jasmine.createSpyObj('LoggingService', ['error']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [BatchNotesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: defaultDialogData },
        { provide: TestBatchDetailsApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
    });

    fixture = TestBed.createComponent(BatchNotesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading()).toBeFalse();
    expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load notes. Please try again.');
  });

  it('should add a note when addControl is valid', fakeAsync(() => {
    component.addControl.setValue('New note');
    component.onAddNote();
    tick();

    expect(apiServiceSpy.addNote).toHaveBeenCalledWith('WS001', 'New note');
    expect(component.submitting()).toBeFalse();
  }));

  it('should not add a note when addControl is empty', () => {
    component.addControl.setValue('');
    component.addControl.markAsTouched();
    component.onAddNote();
    expect(apiServiceSpy.addNote).not.toHaveBeenCalled();
  });

  it('should not add a note with only whitespace', () => {
    component.addControl.setValue('   ');
    component.onAddNote();
    expect(apiServiceSpy.addNote).not.toHaveBeenCalled();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should start editing a note', () => {
    const note = mockNotes[0];
    component.onStartEdit(note);
    expect(component.editingAuditKey()).toBe(1);
    expect(component.editControl.value).toBe('First note');
  });

  it('should cancel editing', () => {
    component.onStartEdit(mockNotes[0]);
    component.onCancelEdit();
    expect(component.editingAuditKey()).toBeNull();
  });

  it('should format date correctly', () => {
    const result = component.formatDate('2024-06-15T10:30:00');
    expect(result).toContain('15');
    expect(result).toContain('JUN');
    expect(result).toContain('2024');
    expect(result).toContain('10:30');
  });

  it('should return dash for null date', () => {
    expect(component.formatDate(null)).toBe('-');
  });
});
