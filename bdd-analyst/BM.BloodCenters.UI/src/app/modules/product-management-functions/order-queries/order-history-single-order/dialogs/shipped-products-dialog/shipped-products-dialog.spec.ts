import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ShippedProductsDialogComponent } from './shipped-products-dialog';
import { ShippedProductsDialogData } from '../../models/order-history-single-order.model';

describe('ShippedProductsDialogComponent', () => {
  let component: ShippedProductsDialogComponent;
  let fixture: ComponentFixture<ShippedProductsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShippedProductsDialogComponent>>;

  const mockData: ShippedProductsDialogData = {
    records: [
      {
        unitId: 'UNIT-001',
        product: 'Red Blood Cells',
        abo: 'O+',
        expirationDate: '2025-12-31T00:00:00',
        shipment: 'SHIP-001',
        price: 125.0,
        warehouseId: 'H',
      },
      {
        unitId: 'UNIT-002',
        product: 'Platelets',
        abo: 'A-',
        expirationDate: '2025-06-15T00:00:00',
        shipment: 'SHIP-002',
        price: 200.0,
      },
    ],
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ShippedProductsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedProductsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct product data', () => {
    expect(component.data.records[0].unitId).toBe('UNIT-001');
    expect(component.data.records[0].product).toBe('Red Blood Cells');
    expect(component.data.records[0].price).toBe(125.0);
  });

  it('should have warehouseId in data', () => {
    expect(component.data.records[0].warehouseId).toBe('H');
  });

  it('should handle missing warehouseId', () => {
    expect(component.data.records[1].warehouseId).toBeUndefined();
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  describe('formatDateTime', () => {
    it('should format a valid date string', () => {
      const result = component.formatDateTime('2025-03-01T14:30:00');
      expect(result).toBe('1-MAR-2025, 14:30');
    });

    it('should return "--" for null', () => {
      expect(component.formatDateTime(null)).toBe('--');
    });

    it('should return "--" for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('--');
    });

    it('should return "--" for empty string', () => {
      expect(component.formatDateTime('')).toBe('--');
    });

    it('should return original for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });

    it('should format midnight correctly', () => {
      const result = component.formatDateTime('2025-01-15T00:00:00');
      expect(result).toBe('15-JAN-2025, 00:00');
    });

    it('should format noon correctly', () => {
      const result = component.formatDateTime('2025-01-15T12:00:00');
      expect(result).toBe('15-JAN-2025, 12:00');
    });

    it('should pad single-digit hours', () => {
      const result = component.formatDateTime('2025-06-05T09:05:00');
      expect(result).toBe('5-JUN-2025, 09:05');
    });
  });

  describe('Template Rendering', () => {
    it('should display dialog title', () => {
      const title = fixture.nativeElement.querySelector('.dialog-header h2');
      expect(title.textContent).toContain('Shipped Products');
    });

    it('should render table headers including Warehouse', () => {
      const headers = fixture.nativeElement.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      expect(headerTexts).toContain('Warehouse');
      expect(headerTexts).toContain('Unit ID');
      expect(headerTexts).toContain('Product');
      expect(headerTexts).toContain('ABO');
      expect(headerTexts).toContain('Price');
    });

    it('should render product rows', () => {
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should have a close button', () => {
      const closeBtn = fixture.nativeElement.querySelector('.dialog-footer button');
      expect(closeBtn.textContent.trim()).toContain('CLOSE');
    });
  });
});

describe('ShippedProductsDialogComponent - Empty', () => {
  let fixture: ComponentFixture<ShippedProductsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShippedProductsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { records: [] } },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippedProductsDialogComponent);
    fixture.detectChanges();
  });

  it('should show empty row message when no records', () => {
    const emptyRow = fixture.nativeElement.querySelector('.empty-row');
    expect(emptyRow.textContent).toContain('No shipped products found.');
  });
});
