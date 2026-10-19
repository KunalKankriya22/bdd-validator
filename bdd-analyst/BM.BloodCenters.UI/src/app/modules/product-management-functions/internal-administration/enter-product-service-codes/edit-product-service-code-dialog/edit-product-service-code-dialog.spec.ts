import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { EditProductServiceCodeDialog } from './edit-product-service-code-dialog';
import { ProductServiceCodeDto } from '../models/enter-product-service-codes.model';
import { EnterProductServiceCodesApiService } from '../services/enter-product-service-codes-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ConfirmActionDialogComponent } from '@shared/components/confirm-action-dialog/confirm-action-dialog.component';

describe('EditProductServiceCodeDialog', () => {
  let component: EditProductServiceCodeDialog;
  let fixture: ComponentFixture<EditProductServiceCodeDialog>;
  let apiServiceSpy: jasmine.SpyObj<EnterProductServiceCodesApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerSpy: any;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockData: ProductServiceCodeDto = {
    productCode: 'E0345',
    productDesc: 'RED BLOOD CELLS',
    productType: 'RBC',
    invProductType: 'RBC',
    outOfStateFlag: 'Y',
    returnable: 'N',
    stdPrice: 94.00,
    serviceCode: 'F04250',
    lastModifiedDate: new Date('2026-01-15T10:30:00Z'),
    programId: 'DISTRIBUTIONS'
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('apiService', ['updateProductServiceCode']);
    snackbarSpy = jasmine.createSpyObj('snackbar', ['showSuccess', 'showError']);
    headerSpy = jasmine.createSpyObj('header', ['getCurrentChapterTimezone']);
    headerSpy.chapterTimeZone = '';
    dialogSpy = jasmine.createSpyObj('dialog', ['open']);

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, EditProductServiceCodeDialog],
      providers: [
        { provide: EnterProductServiceCodesApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy }
      ]
    });

    fixture = TestBed.createComponent(EditProductServiceCodeDialog);
    component = fixture.componentInstance;

    // Override injected services for standalone component safety
    (component as any).service = apiServiceSpy;
    (component as any).snackbarService = snackbarSpy;
    (component as any).headerService = headerSpy;
    (component as any).dialog = dialogSpy;

    fixture.detectChanges();
  });

  // -- Form Init --

  describe('Form Initialization', () => {
    it('should have stdPrice and serviceCode controls', () => {
      expect(component.editForm.get('stdPrice')).toBeTruthy();
      expect(component.editForm.get('serviceCode')).toBeTruthy();
    });

    it('should have min(0) validator on stdPrice', () => {
      component.editForm.get('stdPrice')!.setValue(-1);
      expect(component.editForm.get('stdPrice')!.hasError('min')).toBeTrue();
    });

    it('should have maxLength(8) validator on serviceCode', () => {
      component.editForm.get('serviceCode')!.setValue('ABCDEFGHI');
      expect(component.editForm.get('serviceCode')!.hasError('maxlength')).toBeTrue();
    });
  });

  // -- ngOnChanges / populateForm --

  describe('ngOnChanges / populateForm', () => {
    function triggerChanges(data: ProductServiceCodeDto | null): void {
      component.data = data;
      component.ngOnChanges({
        data: new SimpleChange(null, data, false)
      });
    }

    it('should populate editModeValues from data', () => {
      triggerChanges(mockData);

      expect(component.editModeValues.productCode).toBe('E0345');
      expect(component.editModeValues.productDesc).toBe('RED BLOOD CELLS');
      expect(component.editModeValues.productType).toBe('RBC');
      expect(component.editModeValues.invProductType).toBe('RBC');
    });

    it('should set outOfState to "Yes" when flag is "Y"', () => {
      triggerChanges(mockData);
      expect(component.editModeValues.outOfState).toBe('Yes');
    });

    it('should set returnable to "No" when flag is "N"', () => {
      triggerChanges(mockData);
      expect(component.editModeValues.returnable).toBe('No');
    });

    it('should patch form with data values', () => {
      triggerChanges(mockData);

      expect(component.editForm.get('stdPrice')!.value).toBe(94.00);
      expect(component.editForm.get('serviceCode')!.value).toBe('F04250');
    });

    it('should set lastUpdated when lastModifiedDate exists', () => {
      triggerChanges(mockData);
      expect(component.lastUpdated).toContain('Last Modified:');
      expect(component.lastUpdated).toContain('PST');
    });

    it('should set empty lastUpdated when no lastModifiedDate', () => {
      const dataWithoutDate = { ...mockData, lastModifiedDate: undefined };
      triggerChanges(dataWithoutDate);
      expect(component.lastUpdated).toBe('');
    });
  });

  // -- isFormValid --

  describe('isFormValid', () => {
    function triggerChanges(data: ProductServiceCodeDto | null): void {
      component.data = data;
      component.ngOnChanges({
        data: new SimpleChange(null, data, false)
      });
    }

    it('should return false when form is invalid (negative price)', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(-5);
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when no values have changed', () => {
      triggerChanges(mockData);
      // Form values match originals - no change
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when stdPrice changed', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(100);
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true when serviceCode changed', () => {
      triggerChanges(mockData);
      component.editForm.get('serviceCode')!.setValue('NEWCODE');
      expect(component.isFormValid).toBeTrue();
    });
  });

  // -- onPriceKeypress --

  describe('onPriceKeypress', () => {
    function createKeyEvent(key: string, value: string): any {
      return {
        key,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { value }
      };
    }

    it('should block "-" key', () => {
      const event = createKeyEvent('-', '123');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block "e" key', () => {
      const event = createKeyEvent('e', '123');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block "E" key', () => {
      const event = createKeyEvent('E', '123');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block "+" key', () => {
      const event = createKeyEvent('+', '123');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block duplicate "."', () => {
      const event = createKeyEvent('.', '12.34');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block third decimal digit', () => {
      const event = createKeyEvent('5', '12.34');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block 8th integer digit', () => {
      const event = createKeyEvent('8', '1234567');
      component.onPriceKeypress(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // -- onPricePaste --

  describe('onPricePaste', () => {
    function createPasteEvent(text: string): any {
      return {
        clipboardData: { getData: () => text },
        preventDefault: jasmine.createSpy('preventDefault')
      };
    }

    it('should allow valid paste "123.45"', () => {
      const event = createPasteEvent('123.45');
      component.onPricePaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block invalid paste "abc"', () => {
      const event = createPasteEvent('abc');
      component.onPricePaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // -- onServiceCodeInput --

  describe('onServiceCodeInput', () => {
    it('should convert to uppercase', () => {
      const setValueSpy = spyOn(component.editForm.get('serviceCode')!, 'setValue');
      const event = { target: { value: 'abc' } } as any;
      component.onServiceCodeInput(event);
      expect(setValueSpy).toHaveBeenCalledWith('ABC', { emitEvent: false });
    });

    it('should not call setValue when already uppercase', () => {
      const setValueSpy = spyOn(component.editForm.get('serviceCode')!, 'setValue');
      const event = { target: { value: 'ABC' } } as any;
      component.onServiceCodeInput(event);
      expect(setValueSpy).not.toHaveBeenCalled();
    });
  });

  // -- onSave --

  describe('onSave', () => {
    function triggerChanges(data: ProductServiceCodeDto | null): void {
      component.data = data;
      component.ngOnChanges({
        data: new SimpleChange(null, data, false)
      });
    }

    it('should call markAllAsTouched', () => {
      const spy = spyOn(component.editForm, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });

    it('should not call API when isFormValid is false', () => {
      triggerChanges(mockData);
      // No changes made - isFormValid is false
      component.onSave();
      expect(apiServiceSpy.updateProductServiceCode).not.toHaveBeenCalled();
    });

    it('should not call API when data is null', () => {
      component.data = null;
      component.onSave();
      expect(apiServiceSpy.updateProductServiceCode).not.toHaveBeenCalled();
    });

    it('should call API and emit on success', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(200);
      apiServiceSpy.updateProductServiceCode.and.returnValue(of(undefined));

      const saveSpy = spyOn(component.saveSuccess, 'emit');
      const closeSpy = spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(apiServiceSpy.updateProductServiceCode).toHaveBeenCalledWith('E0345', {
        stdPrice: 200,
        serviceCode: 'F04250'
      });
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should set isSaving false on error', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(200);
      apiServiceSpy.updateProductServiceCode.and.returnValue(throwError(() => new Error('fail')));

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });
  });

  // ── onClearAll ──────────────────────────────────────────────────────

  describe('onClearAll', () => {
    it('should patch null/empty and mark dirty on clearAll', () => {
      component.editForm.get('stdPrice')!.setValue(50);
      component.editForm.get('serviceCode')!.setValue('TEST');

      component.onClearAll();

      expect(component.editForm.get('stdPrice')!.value).toBeNull();
      expect(component.editForm.get('serviceCode')!.value).toBe('');
      expect(component.editForm.dirty).toBeTrue();
    });
  });

  // ── onCancel / Unsaved Changes ────────────────────────────────────

  describe('onCancel / Unsaved Changes', () => {
    function triggerChanges(data: ProductServiceCodeDto | null): void {
      component.data = data;
      component.ngOnChanges({
        data: new SimpleChange(null, data, false)
      });
    }

    it('should emit closePanel immediately when no changes', () => {
      triggerChanges(mockData);
      const spy = spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(spy).toHaveBeenCalled();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog when price has changed', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(999);

      const mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);

      component.onCancel();

      expect(dialogSpy.open).toHaveBeenCalledWith(
        ConfirmActionDialogComponent,
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title: 'Unsaved Changes',
            message: 'Some changes were not committed. Do you want to erase them?',
            confirmText: 'Yes',
            cancelText: 'No'
          })
        })
      );
    });

    it('should open confirmation dialog when service code has changed', () => {
      triggerChanges(mockData);
      component.editForm.get('serviceCode')!.setValue('NEWCODE');

      const mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);

      component.onCancel();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should close panel when user confirms Yes in dialog', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(999);
      const closeSpy = spyOn(component.closePanel, 'emit');

      const mockDialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);

      component.onCancel();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should NOT close panel when user clicks No in dialog', () => {
      triggerChanges(mockData);
      component.editForm.get('stdPrice')!.setValue(999);
      const closeSpy = spyOn(component.closePanel, 'emit');

      const mockDialogRef = { afterClosed: () => of(false) } as MatDialogRef<any>;
      dialogSpy.open.and.returnValue(mockDialogRef);

      component.onCancel();

      expect(closeSpy).not.toHaveBeenCalled();
    });

    it('should not show dialog when data is null', () => {
      component.data = null;
      const closeSpy = spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not show dialog after clearAll resets to original values', () => {
      triggerChanges({ ...mockData, stdPrice: null, serviceCode: '' });
      component.onClearAll();
      const closeSpy = spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // -- Error getters --

  describe('Error getters', () => {
    it('should return price error message when min error present', () => {
      const control = component.editForm.get('stdPrice')!;
      control.setValue(-1);
      control.markAsTouched();

      expect(component.getPriceError()).toBe('Price must be at least 0');
    });

    it('should return service code error message when maxlength error present', () => {
      const control = component.editForm.get('serviceCode')!;
      control.setValue('ABCDEFGHI');
      control.markAsTouched();

      expect(component.getServiceCodeError()).toBe('Service code must not exceed 8 characters');
    });
  });
});
