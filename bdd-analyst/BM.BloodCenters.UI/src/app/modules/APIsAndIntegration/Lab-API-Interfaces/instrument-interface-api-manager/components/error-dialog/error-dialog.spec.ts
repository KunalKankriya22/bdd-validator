import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorDialog } from './error-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';

describe('ErrorDialog', () => {
  let component: ErrorDialog;
  let fixture: ComponentFixture<ErrorDialog>;

  beforeEach(async () => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockHeaderService = {
      chapterTimeZone: signal('America/New_York')
    };

    await TestBed.configureTestingModule({
      imports: [ErrorDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have add mode', () => {
    expect(component.mode).toBe('add');
  });
});
