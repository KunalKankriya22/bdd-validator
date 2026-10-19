import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ModifyPriceDialog, ModifyPriceDialogData } from './modify-price-dialog';
import { InventoryProductTypeModel } from '../models/inventory-product-types.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('ModifyPriceDialog', () => {
  let component: ModifyPriceDialog;
  let fixture: ComponentFixture<ModifyPriceDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ModifyPriceDialog>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockProducts: InventoryProductTypeModel[] = [
    {
      productType: 'RBC',
      shortName: 'Red Blood Cells',
      description: 'Red blood cells for transfusion',
      price: 250.00,
      lifeSpan: 42,
      lifeSpanInd: 'D',
      sortSequence: 1,
      productGrouping: 'RB',
      aboOnly: true,
      rhRequired: false,
      importAllowed: true,
      pooledProduct: false,
      specialInventory: false,
      tempMax: 6,
      tempMin: 1,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      modificationDate: '2024-02-15'
    },
    {
      productType: 'PLT',
      shortName: 'Platelets',
      description: 'Platelet concentrate',
      price: 450.00,
      lifeSpan: 5,
      lifeSpanInd: 'D',
      sortSequence: 2,
      productGrouping: 'PL',
      aboOnly: false,
      rhRequired: true,
      importAllowed: false,
      pooledProduct: true,
      specialInventory: true,
      tempMax: 24,
      tempMin: 20,
      effectiveDate: '2024-01-01',
      terminationDate: null,
      modificationDate: '2024-02-15'
    }
  ];

  const dialogData: ModifyPriceDialogData = {
    selectedProducts: mockProducts
  };

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = createMockMatSnackBar();



      TestBed.configureTestingModule({
      imports: [ModifyPriceDialog],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(ModifyPriceDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {
    it('should set selectedCount from data', () => {
      expect(component.selectedCount).toBe(2);
    });

    it('should calculate current price as Mixed for different prices', () => {
      expect(component.currentPrice).toBe('Mixed');
    });

    it('should calculate current price as specific value for same prices', async () => {
      const sameProductData: ModifyPriceDialogData = {
        selectedProducts: [
          { ...mockProducts[0], price: 250.00 },
          { ...mockProducts[1], price: 250.00 }
        ]
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ModifyPriceDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: sameProductData }
        ]
      });

      const newFixture = TestBed.createComponent(ModifyPriceDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.currentPrice).toBe('$250.00');
    });

    it('should display dash when no products selected', async () => {
      const emptyData: ModifyPriceDialogData = {
        selectedProducts: []
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ModifyPriceDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: emptyData }
        ]
      });

      const newFixture = TestBed.createComponent(ModifyPriceDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.currentPrice).toBe('-');
    });

    it('should display dash when products have null prices', async () => {
      const nullPriceData: ModifyPriceDialogData = {
        selectedProducts: [
          { ...mockProducts[0], price: null as any },
          { ...mockProducts[1], price: null as any }
        ]
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ModifyPriceDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: nullPriceData }
        ]
      });

      const newFixture = TestBed.createComponent(ModifyPriceDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.currentPrice).toBe('-');
    });



    it('should initialize adjustment types', () => {
      expect(component.adjustmentTypes).toEqual([
        { label: 'Percentage', value: 'percentage' },
        { label: 'Amount', value: 'amount' }
      ]);
    });

    it('should initialize adjustment directions', () => {
      expect(component.adjustmentDirections).toEqual([
        { label: 'Increase', value: 'increase' },
        { label: 'Decrease', value: 'decrease' }
      ]);
    });
  });

  describe('Form Validation', () => {
    it('should require adjustmentValue', () => {
      const control = component.form.get('adjustmentValue');
      control?.setValue(null);

      expect(control?.hasError('required')).toBe(true);
    });


  });
  describe('onConfirm - Percentage Calculations', () => {
    beforeEach(() => {
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentValue: 10
      });
    });



    it('should increase prices by percentage', () => {
      component.form.patchValue({
        adjustmentDirection: 'increase',
        adjustmentValue: 10
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(275.00); // 250 + 10% = 275
      expect(updatedProducts[1].price).toBe(495.00); // 450 + 10% = 495
    });

    it('should decrease prices by percentage', () => {
      component.form.patchValue({
        adjustmentDirection: 'decrease',
        adjustmentValue: 10
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(225.00); // 250 - 10% = 225
      expect(updatedProducts[1].price).toBe(405.00); // 450 - 10% = 405
    });

    it('should handle 25% increase correctly', () => {
      component.form.patchValue({
        adjustmentDirection: 'increase',
        adjustmentValue: 25
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(312.50); // 250 + 25% = 312.50
      expect(updatedProducts[1].price).toBe(562.50); // 450 + 25% = 562.50
    });

    it('should handle 50% decrease correctly', () => {
      component.form.patchValue({
        adjustmentDirection: 'decrease',
        adjustmentValue: 50
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(125.00); // 250 - 50% = 125
      expect(updatedProducts[1].price).toBe(225.00); // 450 - 50% = 225
    });
  });

  describe('onConfirm - Amount Calculations', () => {
    beforeEach(() => {
      component.form.patchValue({
        adjustmentType: 'amount'
      });
    });

    it('should increase prices by fixed amount', () => {
      component.form.patchValue({
        adjustmentDirection: 'increase',
        adjustmentValue: 50
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(300.00); // 250 + 50 = 300
      expect(updatedProducts[1].price).toBe(500.00); // 450 + 50 = 500
    });

    it('should decrease prices by fixed amount', () => {
      component.form.patchValue({
        adjustmentDirection: 'decrease',
        adjustmentValue: 50
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(200.00); // 250 - 50 = 200
      expect(updatedProducts[1].price).toBe(400.00); // 450 - 50 = 400
    });

    it('should allow negative prices (legacy parity)', () => {
      // Updated: Now allows negative prices to match legacy Oracle Forms behavior
      component.form.patchValue({
        adjustmentType: 'amount',
        adjustmentDirection: 'decrease',
        adjustmentValue: 300
      });

      // Mark form as valid
      component.form.updateValueAndValidity();
      expect(component.form.valid).toBeTruthy();

      component.onConfirm();

      // Dialog SHOULD be closed with negative prices
      expect(mockDialogRef.close).toHaveBeenCalled();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(-50.00); // 250 - 300 = -50
      expect(updatedProducts[1].price).toBe(150.00); // 450 - 300 = 150
    });

    it('should handle percentage decrease resulting in negative prices', () => {
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentDirection: 'decrease',
        adjustmentValue: 150 // 150% decrease
      });

      component.form.updateValueAndValidity();
      expect(component.form.valid).toBeTruthy();

      component.onConfirm();

      // Should allow negative result
      expect(mockDialogRef.close).toHaveBeenCalled();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(-125.00); // 250 - (250 * 1.5) = -125
      expect(updatedProducts[1].price).toBe(-225.00); // 450 - (450 * 1.5) = -225
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined prices as zero', async () => {
      const nullPriceData: ModifyPriceDialogData = {
        selectedProducts: [
          { ...mockProducts[0], price: null as any }
        ]
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ModifyPriceDialog],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: nullPriceData }
        ]
      });

      const newFixture = TestBed.createComponent(ModifyPriceDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      newComponent.form.patchValue({
        adjustmentType: 'amount',
        adjustmentDirection: 'increase',
        adjustmentValue: 100
      });

      newComponent.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(100.00); // 0 + 100 = 100
    });

    it('should round prices to 2 decimal places', () => {
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentDirection: 'increase',
        adjustmentValue: 33.33
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      // Should be rounded to 2 decimal places
      expect(updatedProducts[0].price.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });

    it('should preserve all non-price fields', () => {
      component.form.patchValue({
        adjustmentType: 'amount',
        adjustmentDirection: 'increase',
        adjustmentValue: 10
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].productType).toBe('RBC');
      expect(updatedProducts[0].shortName).toBe('Red Blood Cells');
      expect(updatedProducts[0].description).toBe('Red blood cells for transfusion');
      expect(updatedProducts[0].pooledProduct).toBe(false);
    });
  });

  describe('getAdjustmentValueLabel', () => {
    it('should return percentage label when percentage is selected', () => {
      component.form.patchValue({ adjustmentType: 'percentage' });

      expect(component.getAdjustmentValueLabel()).toBe('Percentage (%)');
    });

    it('should return amount label when amount is selected', () => {
      component.form.patchValue({ adjustmentType: 'amount' });

      expect(component.getAdjustmentValueLabel()).toBe('Amount ($)');
    });
  });

  describe('getAdjustmentValuePlaceholder', () => {
    it('should return percentage placeholder when percentage is selected', () => {
      component.form.patchValue({ adjustmentType: 'percentage' });

      expect(component.getAdjustmentValuePlaceholder()).toBe('e.g., 25');
    });

    it('should return amount placeholder when amount is selected', () => {
      component.form.patchValue({ adjustmentType: 'amount' });

      expect(component.getAdjustmentValuePlaceholder()).toBe('e.g., 10.00');
    });
  });

  describe('Price Calculation Precision', () => {
    it('should handle decimal percentages correctly', () => {
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentDirection: 'increase',
        adjustmentValue: 12.5
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(281.25); // 250 + 12.5% = 281.25
    });

    it('should handle decimal amounts correctly', () => {
      component.form.patchValue({
        adjustmentType: 'amount',
        adjustmentDirection: 'increase',
        adjustmentValue: 10.50
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(260.50); // 250 + 10.50 = 260.50
    });

    it('should handle very small percentages', () => {
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentDirection: 'increase',
        adjustmentValue: 0.01
      });

      component.onConfirm();

      const updatedProducts = mockDialogRef.close.calls.mostRecent().args[0];
      expect(updatedProducts[0].price).toBe(250.03); // 250 + 0.01% = 250.025 → 250.03
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete workflow - percentage increase', () => {
      // User selects percentage increase
      component.form.patchValue({
        adjustmentType: 'percentage',
        adjustmentDirection: 'increase',
        adjustmentValue: 20
      });

      expect(component.getAdjustmentValueLabel()).toBe('Percentage (%)');
      expect(component.form.valid).toBe(true);

      component.onConfirm();

      expect(mockDialogRef.close).toHaveBeenCalled();
      const result = mockDialogRef.close.calls.mostRecent().args[0];
      expect(result.length).toBe(2);
      expect(result[0].price).toBe(300.00); // 250 + 20%
      expect(result[1].price).toBe(540.00); // 450 + 20%
    });

    it('should handle complete workflow - amount decrease', () => {
      // User selects amount decrease
      component.form.patchValue({
        adjustmentType: 'amount',
        adjustmentDirection: 'decrease',
        adjustmentValue: 25.50
      });

      expect(component.getAdjustmentValueLabel()).toBe('Amount ($)');
      expect(component.form.valid).toBe(true);

      component.onConfirm();

      expect(mockDialogRef.close).toHaveBeenCalled();
      const result = mockDialogRef.close.calls.mostRecent().args[0];
      expect(result.length).toBe(2);
      expect(result[0].price).toBe(224.50); // 250 - 25.50
      expect(result[1].price).toBe(424.50); // 450 - 25.50
    });
  });
});
