import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';

import { PickSlipProductsDialogComponent } from './pick-slip-products-dialog';
import { MoveOutdatesToOutdateLocationService } from './move-outdates-to-outdate-location.service';

describe('PickSlipProductsDialogComponent', () => {
  let component: PickSlipProductsDialogComponent;
  let fixture: ComponentFixture<PickSlipProductsDialogComponent>;
  let serviceSpy: jasmine.SpyObj<MoveOutdatesToOutdateLocationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PickSlipProductsDialogComponent>>;

  const mockProducts = [
    { unitId: 'W12345678901234', product: 'E0701V00 - WB', checkDigit: '5', status: 'OD' },
    { unitId: 'W98765432109876', product: 'E0702V00 - PRBCS', checkDigit: '3', status: 'OD' },
  ];

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('MoveOutdatesToOutdateLocationService', ['getProductsOnPickSlip']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    const translateSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      onLangChange: of({ lang: 'en', translations: {} }),
      onTranslationChange: of({}),
      onDefaultLangChange: of({}),
    });
    translateSpy.instant.and.returnValue('');
    translateSpy.get.and.returnValue(of(''));

    serviceSpy.getProductsOnPickSlip.and.returnValue(of(mockProducts));

    TestBed.configureTestingModule({
      imports: [PickSlipProductsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MoveOutdatesToOutdateLocationService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { pickSlipId: 'PO0000001234' } },
        { provide: TranslateService, useValue: translateSpy },
      ],
    });

    fixture = TestBed.createComponent(PickSlipProductsDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Table Configuration', () => {
    it('should have 4 columns: unitId, product, checkDigit, status', () => {
      const keys = component.tableConfig.columns.map((c) => c.key);
      expect(keys).toEqual(['unitId', 'product', 'checkDigit', 'status']);
    });

    it('should have Check Digit column header', () => {
      const checkDigitCol = component.tableConfig.columns.find((c) => c.key === 'checkDigit');
      expect(checkDigitCol?.header).toBe('Check Digit');
    });
  });

  describe('Load Products', () => {
    it('should load products on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getProductsOnPickSlip).toHaveBeenCalledWith('PO0000001234');
      expect(component.products()).toEqual(mockProducts);
    }));

    it('should set isLoading false after products load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoading()).toBeFalse();
    }));

    it('should set empty products on error', fakeAsync(() => {
      serviceSpy.getProductsOnPickSlip.and.returnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();
      tick();

      expect(component.products()).toEqual([]);
      expect(component.isLoading()).toBeFalse();
    }));
  });

  describe('Close Dialog', () => {
    it('should close dialog on onClose()', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close dialog when close footer button is clicked', () => {
      component.onFooterButtonClick('close');
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should not close dialog for unknown button action', () => {
      component.onFooterButtonClick('unknown');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });
  });
});
