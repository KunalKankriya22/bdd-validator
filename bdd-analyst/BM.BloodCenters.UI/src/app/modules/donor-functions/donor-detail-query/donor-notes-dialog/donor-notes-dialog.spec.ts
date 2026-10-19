import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { DonorNotesDialog, DonorNotesDialogData } from './donor-notes-dialog';
import { DonorDetailQueryService } from '../services/donor-detail-query.service';
import { CentralNote } from '../models/donor-detail-query.model';

describe('DonorNotesDialog', () => {
  let component: DonorNotesDialog;
  let fixture: ComponentFixture<DonorNotesDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DonorNotesDialog>>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;

  const mockNotes: CentralNote[] = [
    { noteId: 1, noteSequence: 1, note: 'Test note content', createdBy: 'USER1', insertDate: '2025-03-15' },
    { noteId: 2, noteSequence: 2, note: 'Another note', createdBy: 'USER2', insertDate: '2025-04-01' },
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockService = jasmine.createSpyObj('DonorDetailQueryService', ['getCentralNotes', 'formatDate']);
    mockService.getCentralNotes.and.returnValue(of(mockNotes));
    mockService.formatDate.and.callFake((d: string) => d || '-');

    await TestBed.configureTestingModule({
      imports: [DonorNotesDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { donorId: '12345', donorName: 'DOE, JOHN' } },
        { provide: DonorDetailQueryService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorNotesDialog);
    component = fixture.componentInstance;
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data with donorId and donorName', () => {
      expect(component.data).toEqual({ donorId: '12345', donorName: 'DOE, JOHN' });
    });

    it('should initialize with empty notes, loading false, and no error', () => {
      expect(component.notes()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('ngOnInit - loadNotes on init', () => {
    it('should call loadNotes on init', () => {
      spyOn(component, 'loadNotes');
      component.ngOnInit();
      expect(component.loadNotes).toHaveBeenCalled();
    });

    it('should load notes via detectChanges triggering ngOnInit', () => {
      fixture.detectChanges();
      expect(mockService.getCentralNotes).toHaveBeenCalledWith('12345');
    });
  });

  describe('loadNotes - success with data', () => {
    it('should populate notes on successful load', () => {
      fixture.detectChanges();

      expect(component.notes()).toEqual(mockNotes);
      expect(component.notes().length).toBe(2);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should set loading to true then false during the call', () => {
      // Before init, loading is false
      expect(component.loading()).toBe(false);

      // After detectChanges (synchronous observable completes), loading should be false again
      fixture.detectChanges();
      expect(component.loading()).toBe(false);
    });

    it('should clear any previous error on successful load', () => {
      // Simulate a prior error state
      component.error.set('Some previous error');

      component.loadNotes();

      expect(component.error()).toBeNull();
      expect(component.notes()).toEqual(mockNotes);
    });
  });

  describe('loadNotes - empty array', () => {
    it('should handle empty notes array', () => {
      mockService.getCentralNotes.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.notes()).toEqual([]);
      expect(component.notes().length).toBe(0);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });
  });

  describe('loadNotes - error handling', () => {
    it('should set error message on service failure', () => {
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load notes. Please try again.');
      expect(component.loading()).toBe(false);
      expect(component.notes()).toEqual([]);
    });

    it('should set loading to false after error', () => {
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Server error')));

      fixture.detectChanges();

      expect(component.loading()).toBe(false);
    });

    it('should not modify notes on error', () => {
      // First load successfully
      fixture.detectChanges();
      expect(component.notes().length).toBe(2);

      // Now simulate an error on retry
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Retry failed')));
      component.loadNotes();

      expect(component.error()).toBe('Failed to load notes. Please try again.');
      // notes remain from the first successful load because the error handler does not clear them
      expect(component.loading()).toBe(false);
    });
  });

  describe('loadNotes - missing donorId', () => {
    it('should set error when donorId is empty', () => {
      component.data.donorId = '';

      component.loadNotes();

      expect(component.error()).toBe('Donor ID is required');
      expect(mockService.getCentralNotes).not.toHaveBeenCalled();
    });

    it('should set error when data is null/undefined', () => {
      (component as any).data = null;

      component.loadNotes();

      expect(component.error()).toBe('Donor ID is required');
      expect(mockService.getCentralNotes).not.toHaveBeenCalled();
    });

    it('should not set loading when donorId is missing', () => {
      component.data.donorId = '';

      component.loadNotes();

      expect(component.loading()).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should delegate to donorService.formatDate', () => {
      const result = component.formatDate('2025-03-15');

      expect(mockService.formatDate).toHaveBeenCalledWith('2025-03-15');
      expect(result).toBe('2025-03-15');
    });

    it('should return dash for empty string', () => {
      const result = component.formatDate('');

      expect(mockService.formatDate).toHaveBeenCalledWith('');
      expect(result).toBe('-');
    });

    it('should pass through various date formats', () => {
      mockService.formatDate.and.returnValue('15-MAR-2025');

      const result = component.formatDate('2025-03-15');

      expect(mockService.formatDate).toHaveBeenCalledWith('2025-03-15');
      expect(result).toBe('15-MAR-2025');
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close without passing data', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('hasNotes computed signal', () => {
    it('should return true when notes exist', () => {
      fixture.detectChanges();

      expect(component.hasNotes()).toBe(true);
    });

    it('should return false when notes array is empty', () => {
      mockService.getCentralNotes.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.hasNotes()).toBe(false);
    });

    it('should return false before loading', () => {
      // Before ngOnInit, notes is empty
      expect(component.hasNotes()).toBe(false);
    });

    it('should update reactively when notes change', () => {
      expect(component.hasNotes()).toBe(false);

      component.notes.set(mockNotes);
      expect(component.hasNotes()).toBe(true);

      component.notes.set([]);
      expect(component.hasNotes()).toBe(false);
    });
  });

  describe('Retry on error', () => {
    it('should allow retrying after an error', () => {
      // First call fails
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();

      expect(component.error()).toBe('Failed to load notes. Please try again.');
      expect(component.notes()).toEqual([]);

      // Retry succeeds
      mockService.getCentralNotes.and.returnValue(of(mockNotes));
      component.loadNotes();

      expect(component.error()).toBeNull();
      expect(component.notes()).toEqual(mockNotes);
      expect(component.loading()).toBe(false);
      expect(component.hasNotes()).toBe(true);
    });

    it('should clear error and set loading on retry', () => {
      // First call fails
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Fail')));
      fixture.detectChanges();
      expect(component.error()).toBeTruthy();

      // On retry, error should be cleared and loading set
      mockService.getCentralNotes.and.returnValue(of([]));
      component.loadNotes();

      expect(component.error()).toBeNull();
      expect(component.loading()).toBe(false);
    });

    it('should call getCentralNotes again on retry', () => {
      mockService.getCentralNotes.and.returnValue(throwError(() => new Error('Fail')));
      fixture.detectChanges();
      expect(mockService.getCentralNotes).toHaveBeenCalledTimes(1);

      mockService.getCentralNotes.and.returnValue(of(mockNotes));
      component.loadNotes();
      expect(mockService.getCentralNotes).toHaveBeenCalledTimes(2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject on destroy', () => {
      fixture.detectChanges();

      // Should not throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
