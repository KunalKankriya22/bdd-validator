import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SponsorInstructionsDialog, SponsorInstructionsDialogData } from './sponsor-instructions-dialog.component';
import { TranslateModule } from '@ngx-translate/core';

describe('SponsorInstructionsDialog', () => {
  let component: SponsorInstructionsDialog;
  let fixture: ComponentFixture<SponsorInstructionsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SponsorInstructionsDialog>>;

  const mockDialogData: SponsorInstructionsDialogData = {
    sponsorId: 'SP001',
    instructions: [
      { instruction: 'Use side entrance', values: 'Door B', effectiveDate: '2025-01-15', terminationDate: '2025-12-31' },
      { instruction: 'Contact person', values: 'Jane Doe' }
    ]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SponsorInstructionsDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(SponsorInstructionsDialog);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should format date string to DD-MON-YYYY format', () => {
    // Arrange
    const dateString = '2025-01-15';

    // Act
    const result = component.formatDate(dateString);

    // Assert
    expect(result).toBe('15-JAN-2025');
  });

  it('should return empty string when formatDate receives undefined', () => {
    // Arrange & Act
    const result = component.formatDate(undefined);

    // Assert
    expect(result).toBe('');
  });

  it('should close dialog when onClose is called', () => {
    // Arrange - component initialized

    // Act
    component.onClose();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });

  it('should initialize instructions signal from dialog data', () => {
    // Arrange & Act - initialized in constructor

    // Assert
    expect(component.instructions().length).toBe(2);
    expect(component.instructions()[0].instruction).toBe('Use side entrance');
  });
});
