import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SelectPrinterDialogComponent, SelectPrinterDialogData } from './select-printer-dialog';
import type { PrinterDto } from '../models/print-auto-directed-tie-tag.models';

describe('SelectPrinterDialogComponent', () => {
  let component: SelectPrinterDialogComponent;
  let fixture: ComponentFixture<SelectPrinterDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SelectPrinterDialogComponent>>;

  const mockPrinters: PrinterDto[] = [
    { code: 'PRN001', description: 'Main Lobby Printer' },
    { code: 'PRN002', description: 'Lab Printer' },
    { code: 'PRN003', description: null },
  ];

  const mockDialogData: SelectPrinterDialogData = { printers: mockPrinters };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [SelectPrinterDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectPrinterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should receive printers from dialog data', () => {
    expect(component.data.printers).toEqual(mockPrinters);
    expect(component.data.printers.length).toBe(3);
  });

  it('should not pre-select any printer by default', () => {
    expect(component.selectedPrinterCode).toBe('');
  });




  it('should allow changing selected printer', () => {
    expect(component.selectedPrinterCode).toBe('');
    component.selectedPrinterCode = 'PRN003';
    expect(component.selectedPrinterCode).toBe('PRN003');
  });

});
