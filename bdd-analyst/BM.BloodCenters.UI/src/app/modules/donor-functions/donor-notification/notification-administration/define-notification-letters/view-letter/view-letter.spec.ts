import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ViewLetter, ViewLetterData } from './view-letter';
import { LetterView } from '../models/notification-letter.model';
import { NotificationLettersService } from '../services/notification-letters.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('ViewLetter', () => {
  let component: ViewLetter;
  let fixture: ComponentFixture<ViewLetter>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewLetter>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let serviceSpy: jasmine.SpyObj<NotificationLettersService>;

  const mockLetter: LetterView = {
    letterCode: 'BDAY',
    title: 'Happy Birthday',
    description: 'Birthday letter',
    fileName: 'BDAY.html',
    currentVersion: {
      letterId: 'BDAY-001',
      letterCode: 'BDAY',
      versionNo: 2,
      effectiveDate: '01-JAN-2025',
      terminationDate: undefined,
      letterMessage: 'Dear &&DONOR_NAME&&, Happy Birthday!',
      isCurrent: true,
      createdBy: 'John Smith',
      createdDate: '15-DEC-2024'
    }
  };

  const mockDialogData: ViewLetterData = {
    letter: mockLetter
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = createMockMatDialog();
    serviceSpy = jasmine.createSpyObj('NotificationLettersService', ['getLetters', 'previewLetter', 'getTemplateVariables', 'getLetterDetail']);

    // Setup service spy return values
    serviceSpy.getTemplateVariables.and.returnValue(of([]));
    serviceSpy.getLetterDetail.and.returnValue(of(mockLetter));
    serviceSpy.previewLetter.and.returnValue(of(mockLetter));

    TestBed.configureTestingModule({
      imports: [ViewLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: NotificationLettersService, useValue: serviceSpy }
      ]
    });

    fixture = TestBed.createComponent(ViewLetter);
    component = fixture.componentInstance;
  });

  it('should populate display values on init', fakeAsync(() => {
    fixture.detectChanges();
    flush(); // Flush all macrotasks (setTimeout in Promise.all) and microtasks

    expect(component.letterCode).toBe('BDAY');
    expect(component.title).toBe('Happy Birthday');
    expect(component.description).toBe('Birthday letter');
    expect(component.fileName).toBe('BDAY.html');
    expect(component.effectiveDate).toBe('01-JAN-2025');
    expect(component.terminationDate).toBe('—');
    expect(component.versionNo).toBe('2');
    expect(component.letterMessage).toBe('Dear &&DONOR_NAME&&, Happy Birthday!');
    expect(component.createdBy).toBe('John Smith');
    expect(component.createdDate).toBe('15-DEC-2024');
  }));

  it('should generate user initials from full name', fakeAsync(() => {
    fixture.detectChanges();
    flush(); // Flush all macrotasks (setTimeout in Promise.all) and microtasks

    expect(component.userInitials).toEqual(['J', 'S']);
  }));

  it('should generate user initials from single name', fakeAsync(() => {
    const singleNameLetter: LetterView = {
      ...mockLetter,
      currentVersion: {
        ...mockLetter.currentVersion!,
        createdBy: 'Administrator'
      }
    };

    // Reconfigure service spy to return the modified letter
    serviceSpy.getLetterDetail.and.returnValue(of(singleNameLetter));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: { letter: singleNameLetter } },
        { provide: NotificationLettersService, useValue: serviceSpy }
      ]
    }).compileComponents();

    const singleNameFixture = TestBed.createComponent(ViewLetter);
    const singleNameComponent = singleNameFixture.componentInstance;
    singleNameFixture.detectChanges();
    tick(600); // Wait for async operations

    expect(singleNameComponent.userInitials).toEqual(['A']);
  }));

  it('should use default initials when no creator', fakeAsync(() => {
    const noCreatorLetter: LetterView = {
      ...mockLetter,
      currentVersion: {
        ...mockLetter.currentVersion!,
        createdBy: undefined
      }
    };

    // Reconfigure service spy to return the modified letter
    serviceSpy.getLetterDetail.and.returnValue(of(noCreatorLetter));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: { letter: noCreatorLetter } },
        { provide: NotificationLettersService, useValue: serviceSpy }
      ]
    }).compileComponents();

    const noCreatorFixture = TestBed.createComponent(ViewLetter);
    const noCreatorComponent = noCreatorFixture.componentInstance;
    noCreatorFixture.detectChanges();
    tick(600); // Wait for async operations

    expect(noCreatorComponent.userInitials).toEqual(['C', 'V']);
  }));

  it('should display placeholder when version data missing', fakeAsync(() => {
    const noVersionLetter: LetterView = {
      letterCode: 'TEST',
      title: 'Test Letter',
      description: 'Test',
      fileName: 'TEST.html'
    };

    // Configure spy to return the no-version letter
    serviceSpy.getLetterDetail.and.returnValue(of(noVersionLetter));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: { letter: noVersionLetter } },
        { provide: NotificationLettersService, useValue: serviceSpy }
      ]
    }).compileComponents();

    const noVersionFixture = TestBed.createComponent(ViewLetter);
    const noVersionComponent = noVersionFixture.componentInstance;
    noVersionFixture.detectChanges();
    tick(600); // Wait for async operations

    expect(noVersionComponent.effectiveDate).toBe('—');
    expect(noVersionComponent.terminationDate).toBe('—');
    expect(noVersionComponent.versionNo).toBe('—');
    expect(noVersionComponent.createdBy).toBe('—');
    expect(noVersionComponent.createdDate).toBe('—');
  }));


  it('should return correct avatar color class', () => {
    fixture.detectChanges();

    expect(component.getAvatarColorClass(0)).toBe('avatar-primary');
    expect(component.getAvatarColorClass(1)).toBe('avatar-secondary');
    expect(component.getAvatarColorClass(2)).toBe('avatar-tertiary');
    expect(component.getAvatarColorClass(3)).toBe('avatar-primary'); // wraps around
  });

  describe('versionNo passed to getLetterDetail', () => {
    it('should pass versionNo when loading full letter details', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(serviceSpy.getLetterDetail).toHaveBeenCalledWith('BDAY', 'N', 2);
    }));

    it('should load correct version for history letter', fakeAsync(() => {
      const historyLetter: LetterView = {
        letterCode: 'BDAY',
        title: 'Happy Birthday',
        description: 'Birthday letter',
        fileName: 'BDAY.html',
        currentVersion: {
          letterId: 'BDAY-OLD',
          letterCode: 'BDAY',
          versionNo: 1,
          effectiveDate: '01-JAN-2020',
          terminationDate: '31-DEC-2023',
          letterMessage: 'Old version message',
          isCurrent: false,
          createdBy: 'Admin',
          createdDate: '01-JAN-2020'
        }
      };

      serviceSpy.getLetterDetail.and.returnValue(of(historyLetter));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ViewLetter, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MatDialog, useValue: dialogSpy },
          { provide: MAT_DIALOG_DATA, useValue: { letter: historyLetter } },
          { provide: NotificationLettersService, useValue: serviceSpy }
        ]
      }).compileComponents();

      const histFixture = TestBed.createComponent(ViewLetter);
      const histComponent = histFixture.componentInstance;
      histFixture.detectChanges();
      flush();

      expect(serviceSpy.getLetterDetail).toHaveBeenCalledWith('BDAY', 'N', 1);
      expect(histComponent.letterMessage).toBe('Old version message');
      expect(histComponent.versionNo).toBe('1');
    }));
  });

});
