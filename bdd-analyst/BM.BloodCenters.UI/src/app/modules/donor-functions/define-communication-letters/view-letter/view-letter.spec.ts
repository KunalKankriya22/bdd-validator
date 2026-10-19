import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { ViewCommLetter, ViewCommLetterData } from './view-letter';
import { CommLetterView } from '../models/communication-letter.model';
import { CommunicationLettersService } from '../services/communication-letters.service';
import { createMockMatDialog } from '@shared/testing/common-mocks';

jest.mock('../preview-letter/preview-letter', () => ({
  PreviewCommLetter: class MockPreviewCommLetter {},
}));

describe('ViewCommLetter', () => {
  let component: ViewCommLetter;
  let fixture: ComponentFixture<ViewCommLetter>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewCommLetter>>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let serviceSpy: jasmine.SpyObj<CommunicationLettersService>;

  const mockLetter: CommLetterView = {
    letterId: 'L001',
    letterCode: 'BDAY',
    letterTitle: 'Happy Birthday',
    versionNo: 2,
    effDate: '01-JAN-2025',
    termDate: '31-DEC-2025',
    letterContent: 'Dear donor, happy birthday!',
  };

  const mockDialogData: ViewCommLetterData = {
    letter: mockLetter,
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    dialogSpy = createMockMatDialog();
    serviceSpy = jasmine.createSpyObj('CommunicationLettersService', [
      'getLetterContent',
    ]);

    serviceSpy.getLetterContent.and.returnValue(of(mockLetter));

    TestBed.configureTestingModule({
      imports: [ViewCommLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: CommunicationLettersService, useValue: serviceSpy },
      ],
    });

    fixture = TestBed.createComponent(ViewCommLetter);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should assign letter from dialog data in constructor', () => {
    expect(component.letter).toEqual(mockLetter);
  });

  describe('ngOnInit', () => {
    it('should populate display values on init', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('Happy Birthday');
      expect(component.versionNo).toBe('2');
      expect(component.letterMessage).toBe('Dear donor, happy birthday!');
    }));

    it('should call loadFullLetterDetails on init', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(serviceSpy.getLetterContent).toHaveBeenCalledWith('L001');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('populateDisplayValues', () => {
    it('should use letterTitle when available', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('Happy Birthday');
    }));

    it('should fall back to letterCode when letterTitle is empty', fakeAsync(() => {
      const noTitleLetter: CommLetterView = { ...mockLetter, letterTitle: '', letterId: '' };
      component.letter = noTitleLetter;
      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('BDAY');
    }));

    it('should fall back to letterCode when letterTitle is undefined', fakeAsync(() => {
      const noTitleLetter: CommLetterView = { ...mockLetter, letterTitle: undefined as any, letterId: '' };
      component.letter = noTitleLetter;
      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('BDAY');
    }));

    it('should convert versionNo to string', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(component.versionNo).toBe('2');
    }));

    it('should display dash when versionNo is undefined', fakeAsync(() => {
      const noVersionLetter: CommLetterView = { ...mockLetter, versionNo: undefined as any, letterId: '' };
      component.letter = noVersionLetter;
      fixture.detectChanges();
      flush();

      expect(component.versionNo).toBe('—');
    }));

    it('should display dash when versionNo is null', fakeAsync(() => {
      const nullVersionLetter: CommLetterView = { ...mockLetter, versionNo: null as any, letterId: '' };
      component.letter = nullVersionLetter;
      fixture.detectChanges();
      flush();

      expect(component.versionNo).toBe('—');
    }));

    it('should set letterMessage from letterContent', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(component.letterMessage).toBe('Dear donor, happy birthday!');
    }));

    it('should set letterMessage to empty string when letterContent is undefined', fakeAsync(() => {
      const noContentLetter: CommLetterView = { ...mockLetter, letterContent: undefined, letterId: '' };
      component.letter = noContentLetter;
      fixture.detectChanges();
      flush();

      expect(component.letterMessage).toBe('');
    }));

    it('should set letterMessage to empty string when letterContent is empty', fakeAsync(() => {
      const emptyContentLetter: CommLetterView = { ...mockLetter, letterContent: '', letterId: '' };
      component.letter = emptyContentLetter;
      fixture.detectChanges();
      flush();

      expect(component.letterMessage).toBe('');
    }));
  });

  describe('loadFullLetterDetails', () => {
    it('should not call service when letterId is empty', fakeAsync(() => {
      component.letter = { ...mockLetter, letterId: '' };
      fixture.detectChanges();
      flush();

      expect(serviceSpy.getLetterContent).not.toHaveBeenCalled();
    }));

    it('should not call service when letterId is undefined', fakeAsync(() => {
      component.letter = { ...mockLetter, letterId: undefined as any };
      fixture.detectChanges();
      flush();

      expect(serviceSpy.getLetterContent).not.toHaveBeenCalled();
    }));

    it('should set loading to true while fetching', fakeAsync(() => {
      const subject = new Subject<CommLetterView>();
      serviceSpy.getLetterContent.and.returnValue(subject.asObservable());

      fixture.detectChanges();

      expect(component.loading()).toBeTrue();

      subject.next(mockLetter);
      subject.complete();
      flush();
    }));

    it('should set loading to false after successful fetch', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(component.loading()).toBeFalse();
    }));

    it('should update letter with fullLetter when response has letterId', fakeAsync(() => {
      const fullLetter: CommLetterView = {
        ...mockLetter,
        letterContent: 'Full content loaded from server',
        letterTitle: 'Updated Title',
      };
      serviceSpy.getLetterContent.and.returnValue(of(fullLetter));

      fixture.detectChanges();
      flush();

      expect(component.letter).toEqual(fullLetter);
      expect(component.dialogTitle).toBe('Updated Title');
      expect(component.letterMessage).toBe('Full content loaded from server');
    }));

    it('should not update letter when response has no letterId', fakeAsync(() => {
      const emptyResponse = { letterId: '' } as CommLetterView;
      serviceSpy.getLetterContent.and.returnValue(of(emptyResponse));

      fixture.detectChanges();
      flush();

      expect(component.letter).toEqual(mockLetter);
      expect(component.loading()).toBeFalse();
    }));

    it('should not update letter when response is null', fakeAsync(() => {
      serviceSpy.getLetterContent.and.returnValue(of(null as any));

      fixture.detectChanges();
      flush();

      expect(component.letter).toEqual(mockLetter);
      expect(component.loading()).toBeFalse();
    }));

    it('should re-populate display values after successful fetch', fakeAsync(() => {
      const fullLetter: CommLetterView = {
        ...mockLetter,
        letterTitle: 'New Title From Server',
        versionNo: 5,
        letterContent: 'New content from server',
      };
      serviceSpy.getLetterContent.and.returnValue(of(fullLetter));

      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('New Title From Server');
      expect(component.versionNo).toBe('5');
      expect(component.letterMessage).toBe('New content from server');
    }));

    it('should set error message on service error', fakeAsync(() => {
      serviceSpy.getLetterContent.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      flush();

      expect(component.error()).toBe(
        'Failed to load letter content. Please try again.'
      );
    }));

    it('should set loading to false on service error', fakeAsync(() => {
      serviceSpy.getLetterContent.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      flush();

      expect(component.loading()).toBeFalse();
    }));

    it('should not update letter on service error', fakeAsync(() => {
      serviceSpy.getLetterContent.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      flush();

      expect(component.letter).toEqual(mockLetter);
    }));

    it('should unsubscribe from service call on destroy', fakeAsync(() => {
      const subject = new Subject<CommLetterView>();
      serviceSpy.getLetterContent.and.returnValue(subject.asObservable());

      fixture.detectChanges();
      expect(component.loading()).toBeTrue();

      component.ngOnDestroy();

      subject.next({
        ...mockLetter,
        letterTitle: 'Should not update',
      });
      subject.complete();

      expect(component.dialogTitle).toBe('Happy Birthday');
    }));
  });

  describe('onPreview', () => {
    it('should close the dialog ref', () => {
      component.onPreview();

      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should open preview dialog after dynamic import resolves', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      const innerDialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of(null),
      } as any);

      component.onPreview();
      flush();

      expect(dialogRefSpy.close).toHaveBeenCalled();
      expect(innerDialogSpy).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          width: '800px',
          height: '100vh',
          autoFocus: false,
          data: { letter: component.letter },
        })
      );
    }));

    it('should pass panel class and position to preview dialog', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      const innerDialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of(null),
      } as any);

      component.onPreview();
      flush();

      expect(innerDialogSpy).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          position: { right: '0', top: '64px' },
          panelClass: ['comm-letter-drawer', 'preview-letter-drawer'],
        })
      );
    }));
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();

      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close dialog without arguments', () => {
      component.onClose();

      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('signal states', () => {
    it('should initialize loading signal as false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should initialize error signal as null', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('initial property values', () => {
    it('should initialize dialogTitle as empty string', () => {
      expect(component.dialogTitle).toBe('');
    });

    it('should initialize letterMessage as empty string', () => {
      expect(component.letterMessage).toBe('');
    });

    it('should initialize versionNo as empty string', () => {
      expect(component.versionNo).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle letter with all optional fields missing', fakeAsync(() => {
      const minimalLetter: CommLetterView = {
        letterId: '',
        letterCode: 'MIN',
        letterTitle: '',
        versionNo: undefined as any,
        effDate: '',
      };
      component.letter = minimalLetter;
      fixture.detectChanges();
      flush();

      expect(component.dialogTitle).toBe('MIN');
      expect(component.versionNo).toBe('—');
      expect(component.letterMessage).toBe('');
    }));

    it('should handle letter with versionNo of 1', fakeAsync(() => {
      const letterV1: CommLetterView = {
        ...mockLetter,
        versionNo: 1,
      };
      serviceSpy.getLetterContent.and.returnValue(of(letterV1));

      component.letter = letterV1;
      fixture.detectChanges();
      flush();

      expect(component.versionNo).toBe('1');
    }));

    it('should handle letter with very long content', fakeAsync(() => {
      const longContent = 'A'.repeat(5000);
      const letterLong: CommLetterView = {
        ...mockLetter,
        letterContent: longContent,
      };
      serviceSpy.getLetterContent.and.returnValue(of(letterLong));

      component.letter = letterLong;
      fixture.detectChanges();
      flush();

      expect(component.letterMessage).toBe(longContent);
    }));

    it('should handle versionNo of 0 as a valid value', fakeAsync(() => {
      const letterV0: CommLetterView = {
        ...mockLetter,
        versionNo: 0 as any,
        letterId: '',
      };
      component.letter = letterV0;
      fixture.detectChanges();
      flush();

      // 0?.toString() returns '0' which is truthy, so dash is not shown
      expect(component.versionNo).toBe('0');
    }));

    it('should use latest letter data for preview', fakeAsync(() => {
      const updatedLetter: CommLetterView = {
        ...mockLetter,
        letterContent: 'Updated content from server',
      };
      serviceSpy.getLetterContent.and.returnValue(of(updatedLetter));

      fixture.detectChanges();
      flush();

      const innerDialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
        afterClosed: () => of(null),
      } as any);

      component.onPreview();
      flush();

      expect(innerDialogSpy).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: { letter: updatedLetter },
        })
      );
    }));
  });
});
