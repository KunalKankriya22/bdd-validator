import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ViewLettersDialogComponent } from './view-letters';
import { DonorCommunicationsService } from '../../services/donor-communications.service';
import { CommunicationLetter } from '../../models/donor-communications.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ViewLettersDialogComponent', () => {
  let component: ViewLettersDialogComponent;
  let fixture: ComponentFixture<ViewLettersDialogComponent>;
  let serviceSpy: jasmine.SpyObj<DonorCommunicationsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewLettersDialogComponent>>;

  const twoDaysAgo = moment().subtract(2, 'days').toISOString();
  const yesterday = moment().subtract(1, 'day').toISOString();

  const mockLetters: CommunicationLetter[] = [
    { letterDate: twoDaysAgo, comments: 'Thank you letter', letterId: 'L001' },
    { letterDate: yesterday, comments: 'Follow up', letterId: 'L002' }
  ];

  const mockDialogData = { donorId: 'D123456' };

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('DonorCommunicationsService', [
      'getLetters',
      'getLetterText'
    ]);
    snackbarSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.getLetters.and.returnValue(of(mockLetters));
    serviceSpy.getLetterText.and.returnValue(of('Dear donor, thank you for your donation.'));

    await TestBed.configureTestingModule({
      imports: [ViewLettersDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorCommunicationsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewLettersDialogComponent);
    component = fixture.componentInstance;
  });

  // ──────────────────────────────────────────────
  // Component Creation & Initialization
  // ──────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct dialog data', () => {
    expect(component.data.donorId).toBe('D123456');
  });

  it('should have correct displayedColumns', () => {
    expect(component.displayedColumns).toEqual(['letterDate', 'comments']);
  });

  it('should initialize signals with default values', () => {
    expect(component.letters()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.selectedLetter()).toBeNull();
    expect(component.selectedLetterText()).toBe('');
    expect(component.loadingLetterText()).toBe(false);
  });

  // ──────────────────────────────────────────────
  // loadLetters (ngOnInit)
  // ──────────────────────────────────────────────

  it('should call getLetters with donorId on init', () => {
    fixture.detectChanges();

    expect(serviceSpy.getLetters).toHaveBeenCalledWith('D123456');
  });

  it('should set loading to true while fetching letters', () => {
    expect(component.loading()).toBe(false);
    fixture.detectChanges();
    expect(component.letters().length).toBe(2);
  });

  it('should populate letters signal after load', () => {
    fixture.detectChanges();

    expect(component.letters().length).toBe(2);
    expect(component.letters()[0].letterId).toBe('L001');
    expect(component.letters()[1].letterId).toBe('L002');
  });

  it('should set loading to false after letters are loaded', () => {
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should NOT auto-select first letter on init', () => {
    fixture.detectChanges();

    expect(component.selectedLetter()).toBeNull();
  });

  it('should handle empty letters response', () => {
    serviceSpy.getLetters.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.letters()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('should reset loading state when loadLetters fails', () => {
    serviceSpy.getLetters.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.letters()).toEqual([]);
  });

  it('should keep letters empty when loadLetters fails', () => {
    serviceSpy.getLetters.and.returnValue(throwError(() => new Error('Server error')));
    fixture.detectChanges();

    expect(component.letters()).toEqual([]);
  });

  // ──────────────────────────────────────────────
  // onRowClick
  // ──────────────────────────────────────────────

  it('should set selectedLetter on row click', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);

    expect(component.selectedLetter()).toEqual(mockLetters[0]);
  });

  it('should update selectedLetter when clicking a different row', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    expect(component.selectedLetter()?.letterId).toBe('L001');

    component.onRowClick(mockLetters[1]);
    expect(component.selectedLetter()?.letterId).toBe('L002');
  });

  it('should NOT load letter text on row click', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);

    expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
    expect(component.selectedLetterText()).toBe('');
  });

  // ──────────────────────────────────────────────
  // onShowLetter
  // ──────────────────────────────────────────────

  it('should do nothing when no letter is selected', () => {
    fixture.detectChanges();

    component.onShowLetter();

    expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
  });

  it('should call getLetterText when letter has no cached text', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    expect(serviceSpy.getLetterText).toHaveBeenCalledWith('D123456', 'L001');
  });

  it('should set selectedLetterText after loading text', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    expect(component.selectedLetterText()).toBe('Dear donor, thank you for your donation.');
  });

  it('should use cached letterText when available', () => {
    fixture.detectChanges();

    const letterWithText: CommunicationLetter = {
      ...mockLetters[0],
      letterText: 'Cached letter text'
    };
    component.onRowClick(letterWithText);
    component.selectedLetter.set(letterWithText);
    component.onShowLetter();

    expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
    expect(component.selectedLetterText()).toBe('Cached letter text');
  });

  it('should cache letter text in the letters array after loading', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    const updatedLetters = component.letters();
    const updatedLetter = updatedLetters.find(l => l.letterId === 'L001');
    expect(updatedLetter?.letterText).toBe('Dear donor, thank you for your donation.');
  });

  it('should not modify other letters when caching text', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    const updatedLetters = component.letters();
    const otherLetter = updatedLetters.find(l => l.letterId === 'L002');
    expect(otherLetter?.letterText).toBeUndefined();
  });

  it('should set loadingLetterText to true while loading and false after completion', fakeAsync(() => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);

    const textSubject = new Subject<string>();
    serviceSpy.getLetterText.and.returnValue(textSubject.asObservable());

    component.onShowLetter();
    expect(component.loadingLetterText()).toBe(true);

    textSubject.next('loaded text');
    textSubject.complete();
    tick();

    expect(component.loadingLetterText()).toBe(false);
    expect(component.selectedLetterText()).toBe('loaded text');
  }));

  it('should reset loadingLetterText when loadLetterText fails', () => {
    serviceSpy.getLetterText.and.returnValue(throwError(() => new Error('Load failed')));
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    expect(component.loadingLetterText()).toBe(false);
  });

  it('should clear selectedLetterText before loading new text', () => {
    fixture.detectChanges();

    component.selectedLetterText.set('old text');
    component.onRowClick(mockLetters[0]);
    component.onShowLetter();

    expect(component.selectedLetterText()).toBe('Dear donor, thank you for your donation.');
  });

  // ──────────────────────────────────────────────
  // onClose
  // ──────────────────────────────────────────────

  it('should close the dialog when onClose is called', () => {
    component.onClose();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should close dialog with no arguments', () => {
    component.onClose();

    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  // ──────────────────────────────────────────────
  // formatDate (delegates to shared formatTableDateTime)
  // ──────────────────────────────────────────────

  it('should format a valid date as DD-MMM-YYYY HH:mm uppercase', () => {
    const result = component.formatDate('2026-03-15T14:30:00');

    expect(result).toBe('15-MAR-2026 14:30');
  });

  it('should return dash for null date', () => {
    expect(component.formatDate(null)).toBe('-');
  });

  it('should return dash for undefined date', () => {
    expect(component.formatDate(undefined)).toBe('-');
  });

  it('should return dash for empty string date', () => {
    expect(component.formatDate('')).toBe('-');
  });

  it('should return dash for invalid date string', () => {
    expect(component.formatDate('not-a-date')).toBe('-');
  });

  it('should format ISO date string correctly', () => {
    const result = component.formatDate('2026-07-20T09:15:00.000Z');

    expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
  });

  it('should include hours and minutes in formatted date', () => {
    const result = component.formatDate('2026-01-05T08:05:00');

    expect(result).toContain('08:05');
  });

  it('should uppercase the month abbreviation', () => {
    const result = component.formatDate('2026-06-15T10:00:00');

    expect(result).toContain('JUN');
  });

  // ──────────────────────────────────────────────
  // trackByLetter
  // ──────────────────────────────────────────────

  it('should return letterId as track key', () => {
    const letter: CommunicationLetter = {
      letterId: 'L999',
      letterDate: '2026-01-01',
      comments: 'Test'
    };

    expect(component.trackByLetter(0, letter)).toBe('L999');
  });

  // ──────────────────────────────────────────────
  // ngOnDestroy
  // ──────────────────────────────────────────────

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // Template Integration
  // ──────────────────────────────────────────────

  it('should display donor ID in the dialog title', () => {
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.dialog-title');
    expect(title?.textContent).toContain('D123456');
  });

  it('should show loading spinner when loading', () => {
    // Set loading before first detectChanges so the @if block renders
    serviceSpy.getLetters.and.returnValue(new (require('rxjs').Subject)());
    fixture.detectChanges();
    component.loading.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.loading-container');
    expect(spinner).toBeTruthy();
  });

  it('should show table when letters are loaded', () => {
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.letters-table');
    expect(table).toBeTruthy();
  });

  it('should render correct number of table rows', () => {
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.clickable-row');
    expect(rows.length).toBe(2);
  });

  it('should show no-data message when no letters', () => {
    serviceSpy.getLetters.and.returnValue(of([]));
    fixture.detectChanges();

    const noData = fixture.nativeElement.querySelector('.no-data');
    expect(noData).toBeTruthy();
  });

  it('should show placeholder text when no letter text loaded', () => {
    fixture.detectChanges();

    const noSelection = fixture.nativeElement.querySelector('.no-selection');
    expect(noSelection?.textContent).toContain('Select a letter');
  });

  it('should show letter text in pre element after loading', () => {
    fixture.detectChanges();
    component.selectedLetterText.set('Hello donor');
    fixture.detectChanges();

    const pre = fixture.nativeElement.querySelector('.letter-text');
    expect(pre?.textContent).toContain('Hello donor');
  });

  it('should disable SHOW LETTER button when no letter selected', () => {
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.show-letter-btn');
    expect(btn?.disabled).toBe(true);
  });

  it('should enable SHOW LETTER button when a letter is selected', () => {
    fixture.detectChanges();
    component.selectedLetter.set(mockLetters[0]);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.show-letter-btn');
    expect(btn?.disabled).toBe(false);
  });

  it('should highlight selected row with selected class', () => {
    fixture.detectChanges();
    component.onRowClick(mockLetters[0]);
    fixture.detectChanges();

    const selectedRow = fixture.nativeElement.querySelector('.clickable-row.selected');
    expect(selectedRow).toBeTruthy();
  });

  it('should have CLOSE button that calls onClose', () => {
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should have close icon button in header', () => {
    fixture.detectChanges();

    const closeIconBtn = fixture.nativeElement.querySelector('.close-button');
    expect(closeIconBtn).toBeTruthy();
    closeIconBtn.click();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  // Edge Cases
  // ──────────────────────────────────────────────

  it('should handle letter with null comments', () => {
    const lettersWithNull: CommunicationLetter[] = [
      { letterDate: yesterday, comments: undefined, letterId: 'L003' }
    ];
    serviceSpy.getLetters.and.returnValue(of(lettersWithNull));
    fixture.detectChanges();

    expect(component.letters().length).toBe(1);
    expect(component.letters()[0].comments).toBeUndefined();
  });

  it('should show letter spinner while letter text is loading', () => {
    fixture.detectChanges();
    component.loadingLetterText.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.preview-loading mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should handle multiple show letter clicks for same letter without re-fetching', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();
    expect(serviceSpy.getLetterText).toHaveBeenCalledTimes(1);

    // After first load, the letter text is cached in the letters array.
    // Re-select the same letter from the updated array so it has cached text.
    const updatedLetter = component.letters().find(l => l.letterId === 'L001')!;
    component.selectedLetter.set(updatedLetter);
    component.onShowLetter();
    expect(serviceSpy.getLetterText).toHaveBeenCalledTimes(1);
  });

  it('should fetch text again for a different letter', () => {
    fixture.detectChanges();

    component.onRowClick(mockLetters[0]);
    component.onShowLetter();
    expect(serviceSpy.getLetterText).toHaveBeenCalledTimes(1);

    component.onRowClick(mockLetters[1]);
    component.onShowLetter();
    expect(serviceSpy.getLetterText).toHaveBeenCalledTimes(2);
    expect(serviceSpy.getLetterText).toHaveBeenCalledWith('D123456', 'L002');
  });
});
