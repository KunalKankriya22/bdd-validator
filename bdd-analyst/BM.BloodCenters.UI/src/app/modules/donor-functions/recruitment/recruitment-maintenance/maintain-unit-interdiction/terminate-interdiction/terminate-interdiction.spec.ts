import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { TerminateInterdictionComponent, TerminateInterdictionDialogData } from './terminate-interdiction';
import { UnitInterdictionService } from '../services/unit-interdiction.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { TerminationReason } from '../models/unit-interdiction.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { PageHeaderService } from '@shared/services/page-header.service';
import moment from 'moment';

describe('TerminateInterdictionComponent', () => {
  let component: TerminateInterdictionComponent;
  let fixture: ComponentFixture<TerminateInterdictionComponent>;
  let mockService: jasmine.SpyObj<UnitInterdictionService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<TerminateInterdictionComponent>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTerminationReasons: TerminationReason[] = [
    { code: 'RES01', description: 'Results received' },
    { code: 'ADM01', description: 'Administrative correction' },
    { code: 'DON01', description: 'Donor request' }
  ];

  const mockDialogData: TerminateInterdictionDialogData = {
    interdiction: {
      id: '1',
      transactionId: 'TXN001',
      code: 'NS',
      description: 'Needle Stick',
      type: 'INTER',
      effectiveDate: '2026-05-08',
      userId: 'USER001',
      originated: 'SYSTEM',
      isTerminated: false,
      isReleased: false,
      canTerminate: true,
      canRelease: false
    },
    terminationReasons: mockTerminationReasons
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('UnitInterdictionService', ['terminateInterdiction']);
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = createMockMatSnackBar();

    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-07-16'));

    await TestBed.configureTestingModule({
      imports: [
        TerminateInterdictionComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UnitInterdictionService, useValue: mockService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ]
    })
    .overrideComponent(TerminateInterdictionComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminateInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set terminationDate from chapter timezone service', () => {
      expect(component.terminationDate).toBeInstanceOf(Date);
      expect(component.terminationDate.getFullYear()).toBe(2026);
    });

    it('should initialize the form with empty reason and comments', () => {
      expect(component.terminateForm).toBeDefined();
      expect(component.terminateForm.get('reason')?.value).toBe('');
      expect(component.terminateForm.get('comments')?.value).toBe('');
    });

    it('should load termination reasons from dialog data', () => {
      expect(component.terminationReasons.length).toBe(3);
      expect(component.filteredTerminationReasons.length).toBe(3);
    });
  });

  describe('initializeForm validation', () => {
    it('should mark form invalid when reason is empty', () => {
      component.terminateForm.get('reason')?.setValue('');
      expect(component.terminateForm.valid).toBeFalse();
    });

    it('should mark form valid when reason is provided', () => {
      component.terminateForm.get('reason')?.setValue('RES01');
      expect(component.terminateForm.valid).toBeTrue();
    });

    it('should enforce maxLength of 5 on reason field', () => {
      component.terminateForm.get('reason')?.setValue('TOOLONG');
      expect(component.terminateForm.get('reason')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength of 240 on comments field', () => {
      const longComment = 'A'.repeat(241);
      component.terminateForm.get('comments')?.setValue(longComment);
      expect(component.terminateForm.get('comments')?.hasError('maxlength')).toBeTrue();
    });

    it('should update selectedReasonDescription when reason value changes', () => {
      component.terminateForm.get('reason')?.setValue('ADM01');
      expect(component.selectedReasonDescription).toBe('Administrative correction');
    });
  });

  describe('reason search / filterReasons', () => {
    it('should filter reasons by code', () => {
      component.reasonSearchControl.setValue('RES');

      expect(component.filteredTerminationReasons.length).toBe(1);
      expect(component.filteredTerminationReasons[0].code).toBe('RES01');
    });

    it('should filter reasons by description (case insensitive)', () => {
      component.reasonSearchControl.setValue('admin');

      expect(component.filteredTerminationReasons.length).toBe(1);
      expect(component.filteredTerminationReasons[0].description).toBe('Administrative correction');
    });

    it('should show all reasons when search is cleared', () => {
      component.reasonSearchControl.setValue('RES');
      expect(component.filteredTerminationReasons.length).toBe(1);

      component.reasonSearchControl.setValue('');
      expect(component.filteredTerminationReasons.length).toBe(3);
    });
  });

  describe('onTerminate', () => {
    it('should not call service when form is invalid', () => {
      component.terminateForm.get('reason')?.setValue('');
      component.onTerminate();

      expect(mockService.terminateInterdiction).not.toHaveBeenCalled();
    });

    it('should call service with correct request data on valid form', (done) => {
      mockService.terminateInterdiction.and.returnValue(of({ success: true }));
      component.terminateForm.get('reason')?.setValue('RES01');
      component.terminateForm.get('comments')?.setValue('Test comment');

      component.onTerminate();

      setTimeout(() => {
        const callArgs = mockService.terminateInterdiction.calls.mostRecent().args[0];
        expect(callArgs.transactionId).toBe('TXN001');
        expect(callArgs.interCode).toBe('NS');
        expect(callArgs.interType).toBe('INTER');
        expect(callArgs.reasonCode).toBe('RES01');
        expect(callArgs.comments).toBe('Test comment');
        expect(callArgs.insertDate).toBe('2026-05-08');
        done();
      });
    });

    it('should show success snackbar and close dialog on success', (done) => {
      mockService.terminateInterdiction.and.returnValue(of({ success: true }));
      component.terminateForm.get('reason')?.setValue('RES01');

      component.onTerminate();

      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Interdiction terminated successfully',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
        expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
        done();
      });
    });

    it('should show error snackbar with error code on failure', (done) => {
      const error = { error: { message: 'Conflict detected', errorCode: 'ERR42' } };
      mockService.terminateInterdiction.and.returnValue(throwError(() => error));
      component.terminateForm.get('reason')?.setValue('RES01');

      component.onTerminate();

      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Error ERR42: Conflict detected',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['termination-error-snackbar'] })
        );
        expect(component.isSaving).toBeFalse();
        done();
      });
    });

    it('should use fallback error message when error body has no message', (done) => {
      mockService.terminateInterdiction.and.returnValue(throwError(() => ({})));
      component.terminateForm.get('reason')?.setValue('RES01');

      component.onTerminate();

      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Failed to terminate interdiction',
          'DISMISS',
          jasmine.any(Object)
        );
        done();
      });
    });
  });

  describe('formatDisplayDate', () => {
    it('should format date to DD-MMM-YYYY uppercase', () => {
      const date = new Date(2026, 2, 15); // March 15, 2026
      const result = component.formatDisplayDate(date);
      expect(result).toBe('15-MAR-2026');
    });
  });

  describe('onCancel', () => {
    it('should close dialog without passing a result', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
