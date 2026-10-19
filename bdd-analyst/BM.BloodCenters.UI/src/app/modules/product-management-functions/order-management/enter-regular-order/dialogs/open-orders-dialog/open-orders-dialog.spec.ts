import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { OpenOrdersDialogComponent, OpenOrdersDialogData } from './open-orders-dialog';
import { OpenOrderDto } from '../../models/regular-order.model';

describe('OpenOrdersDialogComponent', () => {
  let component: OpenOrdersDialogComponent;
  let fixture: ComponentFixture<OpenOrdersDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<OpenOrdersDialogComponent>>;

  const mockOrders: OpenOrderDto[] = [
    {
      orderNumber: 'ORD-001',
      item: 1,
      product: 'RBC',
      abORh: 'O+',
      quantityRequired: 10,
      quantityShort: 2,
      tierOrder: 1,
      date: '2026-08-01T10:00:00',
      hours: 24,
    },
    {
      orderNumber: 'ORD-002',
      item: 2,
      product: 'PLT',
      abORh: 'A-',
      quantityRequired: 5,
      quantityShort: 0,
      tierOrder: 2,
      date: '2026-08-02T14:30:00',
      hours: 48,
    },
  ];

  const mockDialogData: OpenOrdersDialogData = {
    customerId: 'CUST-001',
    orders: mockOrders,
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [OpenOrdersDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenOrdersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Component creation ───────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Data injection ───────────────────────────────────────────────

  describe('data injection', () => {
    it('should receive customerId from dialog data', () => {
      expect(component.data.customerId).toBe('CUST-001');
    });

    it('should receive orders from dialog data', () => {
      expect(component.data.orders).toEqual(mockOrders);
    });

    it('should receive correct number of orders', () => {
      expect(component.data.orders.length).toBe(2);
    });
  });

  // ─── Table display ────────────────────────────────────────────────

  describe('table display', () => {
    it('should display orders table', () => {
      const table = fixture.nativeElement.querySelector('table.data-table');
      expect(table).toBeTruthy();
    });

    it('should display correct column headers', () => {
      const headers = fixture.nativeElement.querySelectorAll('thead th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      expect(headerTexts).toEqual([
        'Order Number',
        'Item',
        'Prodt',
        'ABORh',
        'Quantity Required',
        'Quantity Short',
        'Tier Order',
        'Date',
        'Hours',
        'Actions',
      ]);
    });

    it('should display correct number of data rows', () => {
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should display order number in first column', () => {
      const firstRowCells = fixture.nativeElement.querySelectorAll('tbody tr:first-child td');
      expect(firstRowCells[0].textContent.trim()).toBe('ORD-001');
    });

    it('should display product in third column', () => {
      const firstRowCells = fixture.nativeElement.querySelectorAll('tbody tr:first-child td');
      expect(firstRowCells[2].textContent.trim()).toBe('RBC');
    });

    it('should have aria-label on the table for accessibility', () => {
      const table = fixture.nativeElement.querySelector('table[role="table"]');
      expect(table.getAttribute('aria-label')).toBe('Open orders');
    });
  });

  // ─── Empty orders ─────────────────────────────────────────────────

  describe('empty orders', () => {
    it('should display "No open orders found." when orders array is empty', async () => {
      const emptyData: OpenOrdersDialogData = {
        customerId: 'CUST-001',
        orders: [],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [OpenOrdersDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
        ],
      }).compileComponents();

      const localFixture = TestBed.createComponent(OpenOrdersDialogComponent);
      localFixture.detectChanges();

      const emptyRow = localFixture.nativeElement.querySelector('.empty-row');
      expect(emptyRow).toBeTruthy();
      expect(emptyRow.textContent.trim()).toBe('No open orders found.');
    });

    it('should have colspan 10 on the empty row', async () => {
      const emptyData: OpenOrdersDialogData = {
        customerId: 'CUST-001',
        orders: [],
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [OpenOrdersDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
        ],
      }).compileComponents();

      const localFixture = TestBed.createComponent(OpenOrdersDialogComponent);
      localFixture.detectChanges();

      const emptyTd = localFixture.nativeElement.querySelector('.empty-row');
      expect(emptyTd.getAttribute('colspan')).toBe('10');
    });
  });

  // ─── Dialog header ────────────────────────────────────────────────

  describe('dialog header', () => {
    it('should display "Open Orders for this Customer" as the header', () => {
      const headerEl = fixture.nativeElement.querySelector('.dialog-header h2');
      expect(headerEl).toBeTruthy();
      expect(headerEl.textContent).toContain('Open Orders for this Customer');
    });

    it('should have a close button in the header', () => {
      const closeBtn = fixture.nativeElement.querySelector('.dialog-header button[mat-icon-button]');
      expect(closeBtn).toBeTruthy();
    });

    it('should have aria-label on close button', () => {
      const closeBtn = fixture.nativeElement.querySelector('.dialog-header button[mat-icon-button]');
      expect(closeBtn.getAttribute('aria-label')).toBe('Close dialog');
    });
  });

  // ─── onExit ───────────────────────────────────────────────────────

  describe('onExit', () => {
    it('should close dialog on exit', () => {
      component.onExit();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should close dialog without passing data', () => {
      component.onExit();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should close dialog exactly once on exit', () => {
      component.onExit();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Footer ───────────────────────────────────────────────────────

  describe('footer', () => {
    it('should have an EXIT button in the footer', () => {
      const footerBtn = fixture.nativeElement.querySelector('mat-dialog-actions button, [mat-dialog-actions] button');
      expect(footerBtn).toBeTruthy();
      expect(footerBtn.textContent.trim()).toBe('EXIT');
    });
  });
});
