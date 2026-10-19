import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import {
  PrintReturnSlipDialogComponent,
  PrintReturnSlipDialogData,
} from './print-return-slip-dialog';

describe('PrintReturnSlipDialogComponent', () => {
  let component: PrintReturnSlipDialogComponent;
  let fixture: ComponentFixture<PrintReturnSlipDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PrintReturnSlipDialogComponent>>;

  const mockPrinters = [
    { printerId: 'P001', printerDescription: 'Printer One' },
    { printerId: 'P002', printerDescription: 'Printer Two' },
  ];

  const defaultDialogData: PrintReturnSlipDialogData = {
    printers: mockPrinters,
    defaultPrinterId: 'P001',
  };

  function createComponent(data: PrintReturnSlipDialogData = defaultDialogData) {
    TestBed.resetTestingModule();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [PrintReturnSlipDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });

    fixture = TestBed.createComponent(PrintReturnSlipDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize printerIdControl as empty with required validator', () => {
    expect(component.printerIdControl.value).toBe('');
    expect(component.printerIdControl.hasError('required')).toBeTrue();
  });

  it('should default closeAndPrint to true', () => {
    expect(component.closeAndPrint).toBeTrue();
  });

  it('should expose dialog data with printers', () => {
    expect(component.data.printers.length).toBe(2);
    expect(component.data.printers[0].printerId).toBe('P001');
  });

  it('should close dialog with null when onCancel is called', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should not close dialog when onPrint is called with invalid form', () => {
    component.onPrint();
    expect(component.printerIdControl.touched).toBeTrue();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog with result when onPrint is called with valid form', () => {
    component.printerIdControl.setValue('P001');
    component.closeAndPrint = true;
    component.onPrint();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      printerId: 'P001',
      closeAndPrint: true,
    });
  });

  it('should close dialog with closeAndPrint false when unchecked', () => {
    component.printerIdControl.setValue('P002');
    component.closeAndPrint = false;
    component.onPrint();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      printerId: 'P002',
      closeAndPrint: false,
    });
  });

  it('should handle empty printers list', () => {
    createComponent({ printers: [] });
    expect(component.data.printers.length).toBe(0);
  });

  it('should mark printerIdControl as touched when printing with invalid control', () => {
    expect(component.printerIdControl.touched).toBeFalse();
    component.onPrint();
    expect(component.printerIdControl.touched).toBeTrue();
  });
});
