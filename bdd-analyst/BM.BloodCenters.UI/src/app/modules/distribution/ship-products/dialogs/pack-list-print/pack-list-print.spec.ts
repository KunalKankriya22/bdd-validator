import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { PackListPrintDialog, PackListPrintDialogData } from './pack-list-print';
import { ShipProductsService } from '../../services/ship-products.service';
import { LovOption } from '../../models/ship-products.model';

describe('PackListPrintDialog', () => {
  let component: PackListPrintDialog;
  let fixture: ComponentFixture<PackListPrintDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PackListPrintDialog>>;
  let serviceSpy: jasmine.SpyObj<ShipProductsService>;

  const mockDialogData: PackListPrintDialogData = {
    shipmentNo: 'SHIP001',
  };

  const mockPrinterOptions: LovOption[] = [
    { value: 'PRN001', label: 'PRN001', description: 'Main Floor Printer' },
    { value: 'PRN002', label: 'PRN002', description: 'Lab Printer' },
  ];

  function createComponent(printerOptions: LovOption[] = mockPrinterOptions) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ShipProductsService', [
      'getPackListPrinterOptions',
    ]);

    serviceSpy.getPackListPrinterOptions.and.returnValue(of(printerOptions));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PackListPrintDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ShipProductsService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PackListPrintDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should create print form with packListPrinterId control', () => {
      expect(component.printForm).toBeTruthy();
      expect(component.printForm.get('packListPrinterId')).toBeTruthy();
    });

    it('should validate packListPrinterId is required', () => {
      component.printForm.get('packListPrinterId')?.setValue('');
      expect(component.printForm.get('packListPrinterId')?.hasError('required')).toBeTrue();
    });
  });

  describe('Load Printer Options', () => {
    it('should load printer options on init', () => {
      expect(serviceSpy.getPackListPrinterOptions).toHaveBeenCalled();
    });

    it('should auto-select first printer as default', () => {
      expect(component.printForm.get('packListPrinterId')?.value).toBe('PRN001');
    });

    it('should not auto-select when no printer options available', () => {
      createComponent([]);
      expect(component.printForm.get('packListPrinterId')?.value).toBe('');
    });

    it('should handle printer options loading error', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      serviceSpy = jasmine.createSpyObj('ShipProductsService', ['getPackListPrinterOptions']);
      serviceSpy.getPackListPrinterOptions.and.returnValue(throwError(() => new Error('fail')));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [PackListPrintDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PackListPrintDialog);
      component = fixture.componentInstance;

      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('onYesShip', () => {
    it('should close with confirmed=true and printerId when form is valid', () => {
      component.printForm.patchValue({ packListPrinterId: 'PRN001' });
      component.onYesShip();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({
        confirmed: true,
        packListPrinterId: 'PRN001',
      });
    });

    it('should not close when form is invalid', () => {
      component.printForm.patchValue({ packListPrinterId: '' });
      component.onYesShip();

      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should set submitted signal on submit attempt', () => {
      component.onYesShip();
      expect((component as any).submitted()).toBeTrue();
    });
  });

  describe('onNo', () => {
    it('should close with confirmed=false', () => {
      component.onNo();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ confirmed: false });
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.printForm.controls);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });
});
