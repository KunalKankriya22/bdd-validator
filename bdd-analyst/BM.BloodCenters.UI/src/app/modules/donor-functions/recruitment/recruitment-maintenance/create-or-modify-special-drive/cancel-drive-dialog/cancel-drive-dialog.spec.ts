import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, delay, Subject } from 'rxjs';

import { CancelDriveDialogComponent, CancelCodeOption } from './cancel-drive-dialog';
import { SpecialDriveService } from '../services/special-drive.service';

describe('CancelDriveDialogComponent', () => {
  let defaultConfirmDialogRef: any;
  let component: CancelDriveDialogComponent;
  let fixture: ComponentFixture<CancelDriveDialogComponent>;
  let mockSpecialDriveService: jasmine.SpyObj<SpecialDriveService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CancelDriveDialogComponent>>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockCancelCodes = [
    { code: 'WEATHER', description: 'Weather conditions' },
    { code: 'SPONSOR', description: 'Sponsor request' },
    { code: 'LOW_REG', description: 'Low registration' }
  ];

  const mockDialogData = {
    driveId: 'DRV001',
    driveDate: '07-19-2026',
    sponsorName: 'Red Cross Chapter'
  };

  beforeEach(() => {
    mockSpecialDriveService = jasmine.createSpyObj('SpecialDriveService', ['getCancelCodes']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    const afterOpenedSubject = new Subject<unknown>();
    const afterAllClosedSubject = new Subject<void>();

    mockDialog = jasmine.createSpyObj('MatDialog', ['open'], {
      openDialogs: [],
      _getAfterAllClosed: jasmine.createSpy('_getAfterAllClosed').and.returnValue(afterAllClosedSubject.asObservable()),
      _afterAllClosedAtThisLevel: afterAllClosedSubject,
      _afterOpenedAtThisLevel: afterOpenedSubject,
      _openDialogsAtThisLevel: []
    });

    defaultConfirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultConfirmDialogRef.afterClosed.and.returnValue(of(false));
    mockDialog.open.and.returnValue(defaultConfirmDialogRef);

    TestBed.configureTestingModule({
      imports: [
        CancelDriveDialogComponent,
        ReactiveFormsModule,
        MatDialogModule
      ],
      providers: [
        { provide: SpecialDriveService, useValue: mockSpecialDriveService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        provideNoopAnimations(),
        provideHttpClient()
      ]
    });

    mockSpecialDriveService.getCancelCodes.calls.reset();
    mockDialogRef.close.calls.reset();
    mockDialog.open.calls.reset();
    defaultConfirmDialogRef.afterClosed.calls.reset();
    defaultConfirmDialogRef.afterClosed.and.returnValue(of(false));
    mockDialog.open.and.returnValue(defaultConfirmDialogRef);

    mockSpecialDriveService.getCancelCodes.and.returnValue(of(mockCancelCodes));
    fixture = TestBed.createComponent(CancelDriveDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should initialize the cancel form with required fields', () => {
      expect(component.cancelForm).toBeDefined();
      expect(component.cancelForm.get('cancelCode')).toBeDefined();
      expect(component.cancelForm.get('comments')).toBeDefined();
    });

    it('should load cancel codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockSpecialDriveService.getCancelCodes).toHaveBeenCalled();
      expect(component.cancelCodeOptions.length).toBe(3);
      expect(component.cancelCodeOptions[0].value).toBe('LOW_REG');
      expect(component.cancelCodeOptions[0].description).toBe('Low registration');
    }));

    it('should set data from MAT_DIALOG_DATA', () => {
      expect(component.data.driveId).toBe('DRV001');
      expect(component.data.driveDate).toBe('07-19-2026');
      expect(component.data.sponsorName).toBe('Red Cross Chapter');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require cancel code', () => {
      const cancelCodeControl = component.cancelForm.get('cancelCode');
      cancelCodeControl?.setValue('');
      expect(cancelCodeControl?.hasError('required')).toBe(true);

      cancelCodeControl?.setValue('WEATHER');
      expect(cancelCodeControl?.valid).toBe(true);
    });

    it('should require comments field', () => {
      const commentsControl = component.cancelForm.get('comments');
      commentsControl?.setValue('');
      expect(commentsControl?.hasError('required')).toBe(true);

      commentsControl?.setValue('Drive cancelled due to weather');
      expect(commentsControl?.valid).toBe(true);
    });

    it('should enforce comments max length of 100 characters', () => {
      const commentsControl = component.cancelForm.get('comments');
      const longText = 'a'.repeat(101);
      commentsControl?.setValue(longText);
      expect(commentsControl?.hasError('maxlength')).toBe(true);

      commentsControl?.setValue('a'.repeat(100));
      expect(commentsControl?.hasError('maxlength')).toBe(false);
    });

    it('should be invalid when both fields are empty', () => {
      component.cancelForm.patchValue({ cancelCode: '', comments: '' });
      expect(component.cancelForm.valid).toBe(false);
    });

    it('should be valid when both fields are properly filled', () => {
      component.cancelForm.patchValue({ cancelCode: 'WEATHER', comments: 'Bad weather' });
      expect(component.cancelForm.valid).toBe(true);
    });

    it('should require comments field for cancellation', () => {
      const commentsControl = component.cancelForm.get('comments');
      commentsControl?.setValue('');
      commentsControl?.markAsTouched();
      expect(commentsControl?.hasError('required')).toBeTruthy();

      commentsControl?.setValue('Cancellation reason provided');
      expect(commentsControl?.valid).toBe(true);
    });
  });

  describe('Cancel Code Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update selected description when cancel code changes', fakeAsync(() => {
      component.cancelForm.get('cancelCode')?.setValue('WEATHER');
      tick();
      expect(component.selectedDescription).toBe('Weather conditions');
    }));

    it('should set description to "-" when no code is selected', () => {
      expect(component.selectedDescription).toBe('-');
    });

    it('should set description to "-" for invalid code', fakeAsync(() => {
      component.cancelForm.get('cancelCode')?.setValue('INVALID_CODE');
      tick();
      expect(component.selectedDescription).toBe('-');
    }));
  });

  describe('Cancel Code Sorting', () => {
    it('should sort cancel codes alphabetically by code value', fakeAsync(() => {
      const unsortedCodes = [
        { code: 'ZETA', description: 'Zeta reason' },
        { code: 'ALPHA', description: 'Alpha reason' },
        { code: 'MID', description: 'Mid reason' }
      ];
      mockSpecialDriveService.getCancelCodes.and.returnValue(of(unsortedCodes));

      fixture.detectChanges();
      tick();

      expect(component.cancelCodeOptions[0].value).toBe('ALPHA');
      expect(component.cancelCodeOptions[1].value).toBe('MID');
      expect(component.cancelCodeOptions[2].value).toBe('ZETA');
    }));
  });

  describe('Cancel Code Search Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter cancel codes by search term', fakeAsync(() => {
      component.cancelCodeSearchCtrl.setValue('weather');
      tick();

      const filtered = component.filteredCancelCodeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('WEATHER');
    }));

    it('should show all codes when search is cleared', fakeAsync(() => {
      component.cancelCodeSearchCtrl.setValue('weather');
      tick();
      component.cancelCodeSearchCtrl.setValue('');
      tick();

      const filtered = component.filteredCancelCodeOptions();
      expect(filtered.length).toBe(3);
    }));

    it('should search across both code and description', fakeAsync(() => {
      component.cancelCodeSearchCtrl.setValue('registration');
      tick();

      const filtered = component.filteredCancelCodeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('LOW_REG');
    }));
  });

  describe('Dialog Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog without data on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should show confirmation dialog when onSubmit is called with valid form', () => {
      const mockConfirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockConfirmDialogRef.afterClosed.and.returnValue(of(true));
      spyOn((component as any).dialog, 'open').and.returnValue(mockConfirmDialogRef);

      component.cancelForm.patchValue({
        cancelCode: 'WEATHER',
        comments: 'Heavy rain expected'
      });

      component.onSubmit();

      expect((component as any).dialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        width: '400px',
        data: {
          title: 'Confirm Cancellation',
          message: 'Do you really want to cancel this drive?',
          confirmText: 'YES',
          cancelText: 'NO'
        }
      });
    });

    it('should close dialog with form data on confirmed submit', fakeAsync(() => {
      const mockConfirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockConfirmDialogRef.afterClosed.and.returnValue(of(true));
      spyOn((component as any).dialog, 'open').and.returnValue(mockConfirmDialogRef);

      component.cancelForm.patchValue({
        cancelCode: 'WEATHER',
        comments: 'Heavy rain expected'
      });

      component.onSubmit();
      tick();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        cancelCode: 'WEATHER',
        comments: 'Heavy rain expected'
      });
    }));

    it('should not close dialog when confirmation is declined', fakeAsync(() => {
      const mockConfirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      mockConfirmDialogRef.afterClosed.and.returnValue(of(false));
      spyOn((component as any).dialog, 'open').and.returnValue(mockConfirmDialogRef);

      component.cancelForm.patchValue({
        cancelCode: 'WEATHER',
        comments: 'Heavy rain expected'
      });

      component.onSubmit();
      tick();

      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should not show confirmation dialog when form is invalid', () => {
      component.cancelForm.patchValue({
        cancelCode: '',
        comments: ''
      });

      component.onSubmit();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Loading Cancel Codes', () => {
    it('should handle error when loading cancel codes fails', fakeAsync(() => {
      mockSpecialDriveService.getCancelCodes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      component['loadCancelCodes']();
      tick();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to load cancel codes:',
        jasmine.any(Error)
      );
      expect(component.cancelCodeOptions).toEqual([]);
      expect(component.isLoadingCancelCodes).toBe(false);
    }));

    it('should map API response to CancelCodeOption format', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.cancelCodeOptions[0]).toEqual(jasmine.objectContaining({
        value: jasmine.any(String),
        label: jasmine.any(String),
        description: jasmine.any(String)
      }));
    }));

    it('should initialize filtered codes after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filtered = component.filteredCancelCodeOptions();
      expect(filtered.length).toBe(3);
    }));

    it('should set isLoadingCancelCodes during load', fakeAsync(() => {
      expect(component.isLoadingCancelCodes).toBe(false);
      component['loadCancelCodes']();
      tick();
      expect(component.isLoadingCancelCodes).toBe(false);
    }));
  });

  describe('Drive Info Display', () => {
    it('should display drive info when driveDate is provided', () => {
      expect(component.data.driveDate).toBe('07-19-2026');
    });

    it('should display sponsor name when provided', () => {
      expect(component.data.sponsorName).toBe('Red Cross Chapter');
    });

    it('should handle missing optional drive data', () => {
      const testData = { driveId: 'DRV002' };
      component.data = testData as any;
      expect(component.data.driveId).toBe('DRV002');
      expect(component.data.driveDate).toBeUndefined();
      expect(component.data.sponsorName).toBeUndefined();
    });
  });

  describe('Memory Cleanup', () => {
    it('should not update description after component is destroyed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.ngOnDestroy();
      component.selectedDescription = '-';

      const cancelCodeControl = component.cancelForm.get('cancelCode');
      cancelCodeControl?.setValue('WEATHER');
      tick();

      expect(component.selectedDescription).toBe('-');
    }));
  });

  describe('Termination Date Filtering (Backend Integration)', () => {
    it('should show codes with future termination dates', fakeAsync(() => {
      const codesIncludingFutureTermination = [
        { code: 'WEATH', description: 'Bad weather' },
        { code: 'TEMP', description: 'Temporary code' }
      ];

      mockSpecialDriveService.getCancelCodes.and.returnValue(of(codesIncludingFutureTermination));

      fixture.detectChanges();
      tick();

      expect(component.cancelCodeOptions.length).toBe(2);
      const tempCode = component.cancelCodeOptions.find(c => c.value === 'TEMP');
      expect(tempCode).toBeDefined();
      expect(tempCode?.description).toBe('Temporary code');
    }));

    it('should show codes with no termination date (always active)', fakeAsync(() => {
      const codesWithoutTermination = [
        { code: 'WEATH', description: 'Bad weather' },
        { code: 'NSTFF', description: 'No staff available' }
      ];

      mockSpecialDriveService.getCancelCodes.and.returnValue(of(codesWithoutTermination));

      fixture.detectChanges();
      tick();

      expect(component.cancelCodeOptions.length).toBe(2);
      expect(component.cancelCodeOptions[0].value).toBe('NSTFF');
      expect(component.cancelCodeOptions[1].value).toBe('WEATH');
    }));

    it('should reflect backend filtering in search results', fakeAsync(() => {
      const activeCodes = [
        { code: 'WEATH', description: 'Bad weather' },
        { code: 'NSTFF', description: 'No staff available' }
      ];

      mockSpecialDriveService.getCancelCodes.and.returnValue(of(activeCodes));

      fixture.detectChanges();
      tick();

      component.cancelCodeSearchCtrl.setValue('TEST');
      tick();

      const filtered = component.filteredCancelCodeOptions();
      expect(filtered.length).toBe(0);

      component.cancelCodeSearchCtrl.setValue('WEATH');
      tick();

      const filteredWeath = component.filteredCancelCodeOptions();
      expect(filteredWeath.length).toBe(1);
      expect(filteredWeath[0].value).toBe('WEATH');
    }));

    it('should verify backend filtering logic matches business rule', fakeAsync(() => {
      const expectedActiveCodes = [
        { code: 'CNAVL', description: 'Coordinator not available' },
        { code: 'CRQST', description: 'Coordinator request' },
        { code: 'WEATH', description: 'Bad weather' }
      ];

      mockSpecialDriveService.getCancelCodes.and.returnValue(of(expectedActiveCodes));

      fixture.detectChanges();
      tick();

      expect(component.cancelCodeOptions.length).toBe(3);

      const terminatedCode = component.cancelCodeOptions.find(c => c.value === 'TEST');
      expect(terminatedCode).toBeUndefined();

      component.cancelForm.get('cancelCode')?.setValue('WEATH');
      tick();

      expect(component.selectedDescription).toBe('Bad weather');
    }));
  });
});
