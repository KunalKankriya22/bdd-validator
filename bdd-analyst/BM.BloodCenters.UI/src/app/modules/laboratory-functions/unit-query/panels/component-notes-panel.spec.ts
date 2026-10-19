import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ComponentNotesPanelComponent, ComponentNotesPanelRecord } from './component-notes-panel';
import { UnitQueryService } from '../unit-query.service';

describe('ComponentNotesPanelComponent', () => {
  let component: ComponentNotesPanelComponent;
  let fixture: ComponentFixture<ComponentNotesPanelComponent>;
  let mockService: jasmine.SpyObj<UnitQueryService>;

  const mockRecord: ComponentNotesPanelRecord = {
    unitId: 'U001', collDate: '2025-01-01', chapterId: 'CH1', productCode: 'RBC',
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitQueryService', ['getComponentNotes']);
    mockService.getComponentNotes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ComponentNotesPanelComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: UnitQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentNotesPanelComponent);
    component = fixture.componentInstance;
    component.record = mockRecord;
  });

  it('should load and map notes on init', () => {
    mockService.getComponentNotes.and.returnValue(of([
      { noteId: 1, noteSeq: 1, note: 'Component note', insertUser: 'user1', insertUserName: 'User One', insertDate: '2025-01-01', auditKey: 1, chapterId: 'CH1' },
    ]));
    fixture.detectChanges();
    expect(component.notes.length).toBe(1);
    expect(component.notes[0].text).toBe('Component note');
    expect(component.loading).toBeFalse();
  });

  it('should show error if no productCode', () => {
    component.record = { ...mockRecord, productCode: null };
    fixture.detectChanges();
    expect(component.error).toBe('No component selected.');
    expect(component.loading).toBeFalse();
  });

  it('should handle API error', () => {
    const apiError = { error: { message: 'Server error occurred' } };
    mockService.getComponentNotes.and.returnValue(throwError(() => apiError));
    fixture.detectChanges();

    expect(component.error).toBe('Server error occurred');
    expect(component.loading).toBeFalse();
    expect(component.notes.length).toBe(0);
  });

  it('should show default error message when error has no message', () => {
    mockService.getComponentNotes.and.returnValue(throwError(() => ({})));
    fixture.detectChanges();

    expect(component.error).toBe('Failed to load component notes.');
    expect(component.loading).toBeFalse();
  });

  it('should handle error with uppercase Message property', () => {
    const apiError = { error: { Message: 'Uppercase error' } };
    mockService.getComponentNotes.and.returnValue(throwError(() => apiError));
    fixture.detectChanges();

    expect(component.error).toBe('Uppercase error');
    expect(component.loading).toBeFalse();
  });

  it('should set loading to true initially', () => {
    expect(component.loading).toBeTrue();
  });

  it('should display empty notes array when API returns no notes', () => {
    mockService.getComponentNotes.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.notes.length).toBe(0);
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should map notes correctly with fallback values', () => {
    mockService.getComponentNotes.and.returnValue(of([
      { noteId: 2, noteSeq: 1, note: null, insertUser: 'user2', insertUserName: null, insertDate: null, auditKey: null, chapterId: 'CH1' },
    ]));
    fixture.detectChanges();

    expect(component.notes.length).toBe(1);
    expect(component.notes[0].text).toBe('');
    expect(component.notes[0].userName).toBe('user2');
    expect(component.notes[0].timestamp).toBe('');
    expect(component.notes[0].id).toBe(0);
  });

  it('should map note with insertUserName when available', () => {
    mockService.getComponentNotes.and.returnValue(of([
      { noteId: 3, noteSeq: 1, note: 'Test note', insertUser: 'user3', insertUserName: 'User Three', insertDate: '2025-06-15', auditKey: 42, chapterId: 'CH1' },
    ]));
    fixture.detectChanges();

    expect(component.notes[0].userName).toBe('User Three');
    expect(component.notes[0].id).toBe(42);
  });

  it('should emit closePanel event', () => {
    spyOn(component.closePanel, 'emit');
    component.closePanel.emit();
    expect(component.closePanel.emit).toHaveBeenCalled();
  });

  it('should call service with formatted date', () => {
    fixture.detectChanges();

    expect(mockService.getComponentNotes).toHaveBeenCalledWith(
      'U001',
      jasmine.any(String),
      'RBC'
    );
  });

  it('should handle multiple notes', () => {
    mockService.getComponentNotes.and.returnValue(of([
      { noteId: 1, noteSeq: 1, note: 'Note 1', insertUser: 'user1', insertUserName: 'User One', insertDate: '2025-01-01', auditKey: 1, chapterId: 'CH1' },
      { noteId: 2, noteSeq: 2, note: 'Note 2', insertUser: 'user2', insertUserName: 'User Two', insertDate: '2025-01-02', auditKey: 2, chapterId: 'CH1' },
      { noteId: 3, noteSeq: 3, note: 'Note 3', insertUser: 'user3', insertUserName: 'User Three', insertDate: '2025-01-03', auditKey: 3, chapterId: 'CH1' },
    ]));
    fixture.detectChanges();

    expect(component.notes.length).toBe(3);
    expect(component.notes[0].text).toBe('Note 1');
    expect(component.notes[2].text).toBe('Note 3');
  });
});
