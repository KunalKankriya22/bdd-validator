import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { PreviewCommLetter, PreviewCommLetterData } from './preview-letter';
import { CommLetterView, PreviewLetterResponse } from '../models/communication-letter.model';
import { CommunicationLettersService } from '../services/communication-letters.service';

describe('PreviewCommLetter', () => {
  let component: PreviewCommLetter;
  let fixture: ComponentFixture<PreviewCommLetter>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PreviewCommLetter>>;
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

  const mockDialogData: PreviewCommLetterData = {
    letter: mockLetter,
  };

  const mockPreviewResponse: PreviewLetterResponse = {
    jobId: 'JOB-123',
    parmId: 'PARM-456',
    reportName: 'Birthday_Report',
    status: 'QUEUED',
    message: 'Report queued successfully',
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('CommunicationLettersService', [
      'previewLetter',
    ]);

    serviceSpy.previewLetter.and.returnValue(of(mockPreviewResponse));

    TestBed.configureTestingModule({
      imports: [PreviewCommLetter, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: CommunicationLettersService, useValue: serviceSpy },
      ],
    });

    fixture = TestBed.createComponent(PreviewCommLetter);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial signal states', () => {
    it('should initialize loading signal as false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should initialize submitted signal as false', () => {
      expect(component.submitted()).toBeFalse();
    });

    it('should initialize error signal as null', () => {
      expect(component.error()).toBeNull();
    });

    it('should initialize previewResult signal as null', () => {
      expect(component.previewResult()).toBeNull();
    });
  });

  describe('dialog data', () => {
    it('should receive letter data from MAT_DIALOG_DATA', () => {
      expect(component.data).toEqual(mockDialogData);
    });

    it('should have the correct letter on data', () => {
      expect(component.data.letter).toEqual(mockLetter);
    });
  });

  describe('ngOnInit', () => {
    it('should call submitPreview on init', () => {
      spyOn(component, 'submitPreview');
      component.ngOnInit();

      expect(component.submitPreview).toHaveBeenCalled();
    });

    it('should trigger the service call via submitPreview on detectChanges', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      expect(serviceSpy.previewLetter).toHaveBeenCalledWith('L001');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should call next on destroy$ subject', () => {
      spyOn(component['destroy$'], 'next');
      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
    });

    it('should call complete on destroy$ subject', () => {
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();

      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should call both next and complete on destroy$', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('submitPreview', () => {
    describe('success path', () => {
      it('should call previewLetter with the letterId from data', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(serviceSpy.previewLetter).toHaveBeenCalledWith('L001');
      }));

      it('should set loading to true at the start', fakeAsync(() => {
        const subject = new Subject<PreviewLetterResponse>();
        serviceSpy.previewLetter.and.returnValue(subject.asObservable());

        fixture.detectChanges();

        expect(component.loading()).toBeTrue();

        subject.next(mockPreviewResponse);
        subject.complete();
        flush();
      }));

      it('should clear error at the start', fakeAsync(() => {
        // Set an error first
        component.error.set('Some previous error');

        const subject = new Subject<PreviewLetterResponse>();
        serviceSpy.previewLetter.and.returnValue(subject.asObservable());

        component.submitPreview();

        expect(component.error()).toBeNull();

        subject.next(mockPreviewResponse);
        subject.complete();
        flush();
      }));

      it('should set previewResult on success', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(component.previewResult()).toEqual(mockPreviewResponse);
      }));

      it('should set submitted to true on success', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(component.submitted()).toBeTrue();
      }));

      it('should set loading to false on success', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(component.loading()).toBeFalse();
      }));

      it('should handle response with no optional message field', fakeAsync(() => {
        const responseNoMessage: PreviewLetterResponse = {
          jobId: 'JOB-789',
          parmId: 'PARM-012',
          reportName: 'Report_NoMsg',
          status: 'QUEUED',
        };
        serviceSpy.previewLetter.and.returnValue(of(responseNoMessage));

        fixture.detectChanges();
        flush();

        expect(component.previewResult()).toEqual(responseNoMessage);
        expect(component.submitted()).toBeTrue();
        expect(component.loading()).toBeFalse();
      }));
    });

    describe('error path', () => {
      it('should set error message from error response body', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({ error: { message: 'Letter not found' } }))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Letter not found');
      }));

      it('should set default error message when error has no message', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({}))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Failed to submit preview report.');
      }));

      it('should set default error message when error is null', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => null)
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Failed to submit preview report.');
      }));

      it('should set default error message when error.error is undefined', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({ error: undefined }))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Failed to submit preview report.');
      }));

      it('should set default error message when error.error.message is empty string', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({ error: { message: '' } }))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Failed to submit preview report.');
      }));

      it('should set loading to false on error', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => new Error('API Error'))
        );

        fixture.detectChanges();
        flush();

        expect(component.loading()).toBeFalse();
      }));

      it('should not set submitted to true on error', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => new Error('API Error'))
        );

        fixture.detectChanges();
        flush();

        expect(component.submitted()).toBeFalse();
      }));

      it('should not set previewResult on error', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => new Error('API Error'))
        );

        fixture.detectChanges();
        flush();

        expect(component.previewResult()).toBeNull();
      }));
    });

    describe('retry behavior', () => {
      it('should allow calling submitPreview again after error', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({ error: { message: 'Server error' } }))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('Server error');
        expect(component.loading()).toBeFalse();

        // Now retry with success
        serviceSpy.previewLetter.and.returnValue(of(mockPreviewResponse));
        component.submitPreview();
        flush();

        expect(component.error()).toBeNull();
        expect(component.previewResult()).toEqual(mockPreviewResponse);
        expect(component.submitted()).toBeTrue();
        expect(component.loading()).toBeFalse();
      }));

      it('should clear previous error on retry', fakeAsync(() => {
        serviceSpy.previewLetter.and.returnValue(
          throwError(() => ({ error: { message: 'First error' } }))
        );

        fixture.detectChanges();
        flush();

        expect(component.error()).toBe('First error');

        const subject = new Subject<PreviewLetterResponse>();
        serviceSpy.previewLetter.and.returnValue(subject.asObservable());
        component.submitPreview();

        // Error should be cleared immediately on retry
        expect(component.error()).toBeNull();
        expect(component.loading()).toBeTrue();

        subject.next(mockPreviewResponse);
        subject.complete();
        flush();
      }));
    });
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

  describe('subscription cleanup', () => {
    it('should unsubscribe from service call on destroy', fakeAsync(() => {
      const subject = new Subject<PreviewLetterResponse>();
      serviceSpy.previewLetter.and.returnValue(subject.asObservable());

      fixture.detectChanges();
      expect(component.loading()).toBeTrue();

      component.ngOnDestroy();

      // Emit after destroy - should not update state
      subject.next(mockPreviewResponse);
      subject.complete();

      expect(component.previewResult()).toBeNull();
      expect(component.submitted()).toBeFalse();
      expect(component.loading()).toBeTrue();
    }));

    it('should not process error after destroy', fakeAsync(() => {
      const subject = new Subject<PreviewLetterResponse>();
      serviceSpy.previewLetter.and.returnValue(subject.asObservable());

      fixture.detectChanges();
      component.ngOnDestroy();

      subject.error(new Error('Post-destroy error'));

      expect(component.error()).toBeNull();
    }));
  });

  describe('edge cases', () => {
    it('should handle letter with empty letterId', fakeAsync(() => {
      const emptyIdData: PreviewCommLetterData = {
        letter: { ...mockLetter, letterId: '' },
      };

      TestBed.resetTestingModule();
      serviceSpy = jasmine.createSpyObj('CommunicationLettersService', [
        'previewLetter',
      ]);
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      serviceSpy.previewLetter.and.returnValue(of(mockPreviewResponse));

      TestBed.configureTestingModule({
        imports: [PreviewCommLetter, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyIdData },
          { provide: CommunicationLettersService, useValue: serviceSpy },
        ],
      });

      const newFixture = TestBed.createComponent(PreviewCommLetter);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();
      flush();

      expect(serviceSpy.previewLetter).toHaveBeenCalledWith('');
    }));

    it('should handle multiple rapid submitPreview calls', fakeAsync(() => {
      fixture.detectChanges();
      flush();

      serviceSpy.previewLetter.calls.reset();
      serviceSpy.previewLetter.and.returnValue(of(mockPreviewResponse));

      component.submitPreview();
      component.submitPreview();
      flush();

      expect(serviceSpy.previewLetter).toHaveBeenCalledTimes(2);
    }));
  });
});
