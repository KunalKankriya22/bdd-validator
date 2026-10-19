import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { PackListPrintConfirmationDialog, PackListPrintConfirmationDialogData } from './pack-list-print-confirmation-dialog';
import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';

describe('PackListPrintConfirmationDialog', () => {
  let component: PackListPrintConfirmationDialog;
  let fixture: ComponentFixture<PackListPrintConfirmationDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PackListPrintConfirmationDialog>>;
  let apiServiceSpy: jasmine.SpyObj<OfflineProductShipmentApiService>;

  const mockDialogData: PackListPrintConfirmationDialogData = {
    shipmentNo: 'SH001'
  };

  const mockPrinters = [
    { code: 'PR1', codeDesc: 'Printer 1' },
    { code: 'PR2', codeDesc: 'Printer 2' },
    { code: 'LAB-PR', codeDesc: 'Lab Printer' }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('OfflineProductShipmentApiService', ['getPrinters']);
    apiServiceSpy.getPrinters.and.returnValue(of(mockPrinters));

    await TestBed.configureTestingModule({
      imports: [PackListPrintConfirmationDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: OfflineProductShipmentApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PackListPrintConfirmationDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have a unique componentId', () => {
    fixture.detectChanges();
    expect(component['componentId']).toContain('pack-list-print-');
  });

  it('should initialize printForm with required validator on packListPrinterId', () => {
    fixture.detectChanges();
    expect(component.printForm).toBeTruthy();
    expect(component.printForm.get('packListPrinterId')?.hasError('required')).toBeTrue();
  });

  it('should call getPrinters on init', () => {
    fixture.detectChanges();
    expect(apiServiceSpy.getPrinters).toHaveBeenCalled();
  });

  it('should populate printers signal on successful load', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component['printers']()).toEqual(mockPrinters);
    expect(component['filteredPrinters']()).toEqual(mockPrinters);
    expect(component['loadingPrinters']()).toBeFalse();
  }));

  it('should handle printer load error', fakeAsync(() => {
    apiServiceSpy.getPrinters.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(component['loadingPrinters']()).toBeFalse();
  }));

  describe('Printer Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter printers when search text is entered', fakeAsync(() => {
      component['printerSearchCtrl'].setValue('Lab');
      tick();
      const filtered = component['filteredPrinters']();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('LAB-PR');
    }));

    it('should show all printers when search is empty', fakeAsync(() => {
      component['printerSearchCtrl'].setValue('');
      tick();
      expect(component['filteredPrinters']()).toEqual(mockPrinters);
    }));

    it('should handle null search value', fakeAsync(() => {
      component['printerSearchCtrl'].setValue(null);
      tick();
      expect(component['filteredPrinters']()).toEqual(mockPrinters);
    }));
  });

  describe('onYesPrint', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close with print result when form is valid', () => {
      component.printForm.patchValue({ packListPrinterId: 'PR1' });
      component.onYesPrint();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ print: true, printerId: 'PR1' });
    });

    it('should not close when form is invalid', () => {
      component.printForm.patchValue({ packListPrinterId: '' });
      component.onYesPrint();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });

  it('should close with print false on onNo', () => {
    fixture.detectChanges();
    component.onNo();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ print: false });
  });

  it('should generate element IDs', () => {
    fixture.detectChanges();
    expect(component['elementId']('printer')).toContain('-printer');
  });

  it('should generate error IDs', () => {
    fixture.detectChanges();
    expect(component['errorId']('printer')).toContain('-printer-error');
  });

  it('should generate label IDs', () => {
    fixture.detectChanges();
    expect(component['labelId']('printer')).toContain('-printer-label');
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    fixture.detectChanges();
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should set shipmentNo from dialog data', () => {
    fixture.detectChanges();
    expect(component.data.shipmentNo).toBe('SH001');
  });
});
