import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { PreviewLetter, PreviewLetterData } from './preview-letter';
import { NotificationLettersService } from '../services/notification-letters.service';

describe('PreviewLetter', () => {
  let component: PreviewLetter;
  let fixture: ComponentFixture<PreviewLetter>;
  let serviceSpy: jasmine.SpyObj<NotificationLettersService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PreviewLetter>>;

  const mockDialogData: PreviewLetterData = {
    letterId: 'BDAY-001'
  };

  const mockPreviewResult = {
    success: true,
    message: 'Preview submitted',
    reportId: 'RPT001'
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('NotificationLettersService', [
      'submitPreviewReport'
    ]);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    serviceSpy.submitPreviewReport.and.returnValue(of(mockPreviewResult));

    TestBed.configureTestingModule({
      imports: [PreviewLetter, NoopAnimationsModule],
      providers: [
        { provide: NotificationLettersService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    serviceSpy.submitPreviewReport.calls.reset();
    dialogRefSpy.close.calls.reset();
    serviceSpy.submitPreviewReport.and.returnValue(of(mockPreviewResult));

    fixture = TestBed.createComponent(PreviewLetter);
    component = fixture.componentInstance;
  });

  it('should submit preview report on init', () => {
    fixture.detectChanges();

    expect(serviceSpy.submitPreviewReport).toHaveBeenCalledWith('BDAY-001');
    expect(component.loading()).toBe(false);
    expect(component.submitted()).toBe(true);
    expect(component.previewResult()).toEqual(mockPreviewResult);
  });

  it('should set error on API failure', () => {
    serviceSpy.submitPreviewReport.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('API Error');
  });

  it('should set error when letterId is missing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PreviewLetter, NoopAnimationsModule],
      providers: [
        { provide: NotificationLettersService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { letterId: '' } }
      ]
    });

    const emptyFixture = TestBed.createComponent(PreviewLetter);
    const emptyComponent = emptyFixture.componentInstance;
    emptyFixture.detectChanges();

    expect(emptyComponent.error()).toBe('Letter ID is required to preview.');
    expect(serviceSpy.submitPreviewReport).not.toHaveBeenCalled();
  });

  it('should handle error response with nested message', () => {
    serviceSpy.submitPreviewReport.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } }))
    );

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Server error');
  });

  it('should close dialog on onClose', () => {
    fixture.detectChanges();

    component.onClose();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
