import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';

import { ViewNotificationLetterDialog } from './view-notification-letter-dialog';
import { ViewNotificationLetterDialogService } from './view-notification-letter-dialog.service';
import {
  ViewNotificationLetterDialogData,
  NotificationLetter,
} from './view-notification-letter-dialog.model';

describe('ViewNotificationLetterDialog', () => {
  let component: ViewNotificationLetterDialog;
  let fixture: ComponentFixture<ViewNotificationLetterDialog>;
  let serviceSpy: jasmine.SpyObj<ViewNotificationLetterDialogService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewNotificationLetterDialog>>;

  const mockDialogData: ViewNotificationLetterDialogData = {
    donorId: 'DN00002315',
  };

  const mockLetters: NotificationLetter[] = [
    {
      letterCode: 'NL001',
      letterSeqNo: '100',
      chapterId: 'CH01',
      letterTitle: 'Initial Notification',
      authorizedBy: 'ADMIN',
      authorizedDate: '2026-01-15T00:00:00',
      generatedBy: 'SYSTEM',
      generatedDate: '2026-01-16T00:00:00',
      lastReprintedBy: 'USER1',
      lastReprintedOn: '2026-02-01T00:00:00',
    },
    {
      letterCode: 'NL002',
      letterSeqNo: '101',
      chapterId: 'CH01',
      letterTitle: 'Follow-up Notification Letter with a Very Long Title That Should Truncate',
      authorizedBy: 'MANAGER',
      authorizedDate: '2026-03-10T00:00:00',
    },
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ViewNotificationLetterDialogService', [
      'getLettersForDonor',
      'getLetterText',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.getLettersForDonor.and.returnValue(of(mockLetters));


      TestBed.configureTestingModule({
      imports: [ViewNotificationLetterDialog, NoopAnimationsModule],
      providers: [
        { provide: ViewNotificationLetterDialogService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });


      serviceSpy.getLettersForDonor.calls.reset();


      serviceSpy.getLetterText.calls.reset();


      dialogRefSpy.close.calls.reset();


      serviceSpy.getLettersForDonor.and.returnValue(of(mockLetters));


    fixture = TestBed.createComponent(ViewNotificationLetterDialog);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should load letters on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getLettersForDonor).toHaveBeenCalledWith('DN00002315');
      expect(component.letters().length).toBe(2);
      expect(component.loading()).toBe(false);
    }));
  });

  describe('Error handling', () => {
    it('should show error container with retry button', fakeAsync(() => {
      serviceSpy.getLettersForDonor.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      const retryBtn = fixture.debugElement.query(By.css('.error-container button'));
      expect(retryBtn).toBeTruthy();
    }));

    it('should retry loading on retry button click', fakeAsync(() => {
      serviceSpy.getLettersForDonor.and.returnValue(
        throwError(() => new Error('Error'))
      );
      fixture.detectChanges();
      tick();

      serviceSpy.getLettersForDonor.and.returnValue(of(mockLetters));
      component.onRetry();
      tick();
      expect(component.letters().length).toBe(2);
      expect(component.error()).toBeNull();
    }));
  });

  describe('Table display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display all 8 columns', () => {
      expect(component.displayedColumns.length).toBe(8);
      expect(component.displayedColumns).toEqual([
        'letterCode',
        'letterTitle',
        'authorizedBy',
        'authorizedDate',
        'generatedBy',
        'generatedDate',
        'lastReprintedBy',
        'lastReprintedOn',
      ]);
    });
  });

  describe('Row selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should select a row on click', () => {
      component.selectRow(mockLetters[0]);
      expect(component.selectedLetter()).toEqual(mockLetters[0]);
    });

    it('should clear letter text when selecting a new row', () => {
      component.letterText.set('Some text');
      component.selectRow(mockLetters[1]);
      expect(component.letterText()).toBeNull();
    });

    it('should apply selected-row class', () => {
      component.selectRow(mockLetters[0]);
      fixture.detectChanges();
      const rows = fixture.debugElement.queryAll(By.css('.letter-row'));
      expect(rows[0].classes['selected-row']).toBe(true);
      expect(rows[1].classes['selected-row']).toBeFalsy();
    });
  });

  describe('Show letter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should fetch and display letter text', fakeAsync(() => {
      serviceSpy.getLetterText.and.returnValue(of('Letter content here'));
      component.selectRow(mockLetters[0]);
      component.onShowLetter();
      tick();
      expect(serviceSpy.getLetterText).toHaveBeenCalledWith('DN00002315', '100', 'CH01');
      expect(component.letterText()).toBe('Letter content here');
      expect(component.loadingDetail()).toBe(false);
    }));

    it('should use cached text on subsequent calls', fakeAsync(() => {
      serviceSpy.getLetterText.and.returnValue(of('Cached content'));
      component.selectRow(mockLetters[0]);
      component.onShowLetter();
      tick();

      serviceSpy.getLetterText.calls.reset();
      component.selectRow(mockLetters[0]);
      component.onShowLetter();
      expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
      expect(component.letterText()).toBe('Cached content');
    }));
  });

  describe('Auto-select letter when no letterSeqNo provided', () => {
    it('should not auto-select any letter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.selectedLetter()).toBeNull();
      expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
    }));
  });
});

describe('ViewNotificationLetterDialog -- auto-select', () => {
  let component: ViewNotificationLetterDialog;
  let fixture: ComponentFixture<ViewNotificationLetterDialog>;
  let serviceSpy: jasmine.SpyObj<ViewNotificationLetterDialogService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewNotificationLetterDialog>>;

  const mockLetters: NotificationLetter[] = [
    {
      letterCode: 'NL001',
      letterSeqNo: '100',
      chapterId: 'CH01',
      letterTitle: 'Initial Notification',
      authorizedBy: 'ADMIN',
      authorizedDate: '2026-01-15T00:00:00',
      generatedBy: 'SYSTEM',
      generatedDate: '2026-01-16T00:00:00',
      lastReprintedBy: 'USER1',
      lastReprintedOn: '2026-02-01T00:00:00',
    },
    {
      letterCode: 'NL002',
      letterSeqNo: '101',
      chapterId: 'CH02',
      letterTitle: 'Follow-up Notification',
    },
  ];

  function createComponent(dialogData: ViewNotificationLetterDialogData): void {
    serviceSpy = jasmine.createSpyObj('ViewNotificationLetterDialogService', [
      'getLettersForDonor',
      'getLetterText',
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.getLettersForDonor.and.returnValue(of(mockLetters));
    serviceSpy.getLetterText.and.returnValue(of('Auto-loaded letter content'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewNotificationLetterDialog, NoopAnimationsModule],
      providers: [
        { provide: ViewNotificationLetterDialogService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewNotificationLetterDialog);
    component = fixture.componentInstance;
  }

  it('should auto-select and show letter when letterSeqNo matches', fakeAsync(() => {
    createComponent({ donorId: 'DN00002315', letterSeqNo: '100' });
    fixture.detectChanges();
    tick();

    expect(component.selectedLetter()).toEqual(mockLetters[0]);
    expect(serviceSpy.getLetterText).toHaveBeenCalledWith('DN00002315', '100', 'CH01');
    expect(component.letterText()).toBe('Auto-loaded letter content');
  }));

  it('should auto-select matching both letterSeqNo and chapterId', fakeAsync(() => {
    createComponent({ donorId: 'DN00002315', letterSeqNo: '101', chapterId: 'CH02' });
    fixture.detectChanges();
    tick();

    expect(component.selectedLetter()).toEqual(mockLetters[1]);
    expect(serviceSpy.getLetterText).toHaveBeenCalledWith('DN00002315', '101', 'CH02');
  }));

  it('should not auto-select when letterSeqNo does not match any letter', fakeAsync(() => {
    createComponent({ donorId: 'DN00002315', letterSeqNo: '999' });
    fixture.detectChanges();
    tick();

    expect(component.selectedLetter()).toBeNull();
    expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
  }));

  it('should not auto-select when chapterId does not match', fakeAsync(() => {
    createComponent({ donorId: 'DN00002315', letterSeqNo: '100', chapterId: 'CH99' });
    fixture.detectChanges();
    tick();

    expect(component.selectedLetter()).toBeNull();
    expect(serviceSpy.getLetterText).not.toHaveBeenCalled();
  }));
});
