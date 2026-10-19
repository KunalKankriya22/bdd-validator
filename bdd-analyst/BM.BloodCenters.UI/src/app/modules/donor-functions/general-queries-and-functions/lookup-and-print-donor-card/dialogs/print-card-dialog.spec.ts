import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { PrintCardDialog } from './print-card-dialog';
import { PrintCardDialogData } from '../models/lookup-donor-card.model';

describe('PrintCardDialog', () => {
  let component: PrintCardDialog;
  let fixture: ComponentFixture<PrintCardDialog>;
  let mockDialogRef: jest.Mocked<MatDialogRef<PrintCardDialog>>;

  const mockDialogData: PrintCardDialogData = {
    printRequest: {
      donorId: 'D001',
      driveId: 'DRV01',
      lastName: 'Smith',
      firstName: 'John',
    } as any,
    printers: [
      { code: 'P1', description: 'Printer One' },
      { code: 'P2', description: 'Printer Two' },
      { code: 'LAB1', description: 'Lab Printer' },
    ],
  };

  beforeEach(async () => {
    mockDialogRef = { close: jest.fn() } as any;

    await TestBed.configureTestingModule({
      imports: [PrintCardDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintCardDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize printers from dialog data', () => {
    expect(component.printers().length).toBe(3);
  });

  it('should default queue control to N', () => {
    expect(component.queueControl.value).toBe('N');
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should compute isQueued as false when queue is N', () => {
    expect(component.isQueued()).toBe(false);
  });

  it('should filter printers by search text', () => {
    (component as any).printerSearch.set('lab');
    expect(component.filteredPrinters().length).toBe(1);
    expect(component.filteredPrinters()[0].code).toBe('LAB1');
  });

  it('should show all printers when search is empty', () => {
    (component as any).printerSearch.set('');
    expect(component.filteredPrinters().length).toBe(3);
  });
});
