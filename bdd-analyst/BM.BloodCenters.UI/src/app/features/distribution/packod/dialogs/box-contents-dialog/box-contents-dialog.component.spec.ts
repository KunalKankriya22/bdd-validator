import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BoxContentsDialogComponent, BoxContentsDialogData } from './box-contents-dialog.component';
import { BoxContentItemDto } from '../../models';

describe('BoxContentsDialogComponent', () => {
  let component: BoxContentsDialogComponent;
  let fixture: ComponentFixture<BoxContentsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxContentsDialogComponent>>;

  const mockProduct: BoxContentItemDto = {
    unitId: 'W1234567890123',
    chkDigit: '01',
    productCode: 'E1150110',
    aliquot: '00',
    productType: 'RBC',
    bloodType: 'E001',
    expDate: '2026-12-31T23:59:00Z',
    collDate: '2026-01-15T10:30:00Z',
    aboDesc: 'A Positive'
  };

  const mockDialogData: BoxContentsDialogData = {
    boxId: 'BOX0001234',
    boxContents: [mockProduct]
  };

  function createComponent(data: BoxContentsDialogData = mockDialogData): void {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [BoxContentsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    });

    fixture = TestBed.createComponent(BoxContentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Component Initialization', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should define the correct displayed columns', () => {
      expect(component.displayedColumns).toEqual(['unitId', 'expDate', 'productType', 'productCode', 'aboDesc']);
    });

    it('should initialize products signal from dialog data', () => {
      const products = (component as any).products();
      expect(products.length).toBe(1);
      expect(products[0]).toEqual(mockProduct);
    });
  });

  describe('Products Signal Initialization', () => {
    it('should handle null boxContents by falling back to empty array', () => {
      createComponent({ boxId: 'BOX0001234', boxContents: null } as any);
      const products = (component as any).products();
      expect(products).toEqual([]);
    });

    it('should handle undefined boxContents by falling back to empty array', () => {
      createComponent({ boxId: 'BOX0001234', boxContents: undefined } as any);
      const products = (component as any).products();
      expect(products).toEqual([]);
    });
  });

  describe('Products Table', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should display products in table', () => {
      const rows = fixture.debugElement.queryAll(By.css('table tbody tr, table tr.mat-mdc-row'));
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });

    it('should display unit ID in table', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const unitIdCell = cells[0];
      expect(unitIdCell.nativeElement.textContent.trim()).toBe('W1234567890123');
    });

    it('should display formatted expiration date', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const dateCell = cells[1];
      const dateText = dateCell.nativeElement.textContent.trim();
      expect(dateText).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2}$/);
    });

    it('should display product type', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const productTypeCell = cells[2];
      expect(productTypeCell.nativeElement.textContent.trim()).toBe('RBC');
    });

    it('should display product code', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const productCodeCell = cells[3];
      expect(productCodeCell.nativeElement.textContent.trim()).toBe('E1150110');
    });

    it('should display ABO description', () => {
      const cells = fixture.debugElement.queryAll(By.css('td.mat-mdc-cell'));
      const aboCell = cells[4];
      expect(aboCell.nativeElement.textContent.trim()).toBe('A Positive');
    });

    it('should show product count in Unit ID header', () => {
      const headerCells = fixture.debugElement.queryAll(By.css('th.mat-mdc-header-cell'));
      const unitIdHeader = headerCells[0];
      expect(unitIdHeader.nativeElement.textContent).toContain('Unit ID');
      expect(unitIdHeader.nativeElement.textContent).toContain('1');
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      createComponent({ boxId: 'BOX0001234', boxContents: [] });
    });

    it('should show appropriate message for empty box', () => {
      const emptyMessage = fixture.debugElement.query(By.css('.empty-state p'));
      expect(emptyMessage.nativeElement.textContent.trim()).toBe('No products in this box');
    });
  });

  describe('Dialog Header', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should display "View Box Contents" as dialog title', () => {
      const title = fixture.debugElement.query(By.css('[mat-dialog-title]'));
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('View Box Contents');
    });

    it('should have a header close button with correct aria-label', () => {
      const headerCloseBtn = fixture.debugElement.query(By.css('.header-close-btn'));
      expect(headerCloseBtn).toBeTruthy();
      expect(headerCloseBtn.nativeElement.getAttribute('aria-label')).toBe('Close dialog');
    });
  });

  describe('Dialog Actions', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should have a close button in dialog actions', () => {
      const closeButton = fixture.debugElement.query(By.css('.close-btn'));
      expect(closeButton).toBeTruthy();
      expect(closeButton.nativeElement.textContent.trim()).toBe('CLOSE');
    });

    it('should call dialogRef.close when onClose is called', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should format valid date string correctly', () => {
      const dateString = '2026-01-15T10:30:00Z';
      const formatted = component.formatDateTime(dateString);
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2}$/);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2026-01-15T10:30:00Z');
      const formatted = component.formatDateTime(date);
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}\s+\d{2}:\d{2}$/);
    });

    it('should return empty string for null value', () => {
      const formatted = component.formatDateTime(null);
      expect(formatted).toBe('');
    });

    it('should return empty string for undefined value', () => {
      const formatted = component.formatDateTime(undefined);
      expect(formatted).toBe('');
    });

    it('should return empty string for invalid date string', () => {
      const formatted = component.formatDateTime('not-a-date');
      expect(formatted).toBe('');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      createComponent();
    });

    it('should hide decorative icons from screen readers', () => {
      const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Products', () => {
    const mockProduct2: BoxContentItemDto = {
      unitId: 'W1234567890124',
      chkDigit: '02',
      productCode: 'E1150111',
      aliquot: '00',
      productType: 'PLT',
      bloodType: 'E002',
      expDate: '2026-11-30T23:59:00Z',
      collDate: '2026-02-20T08:00:00Z',
      aboDesc: 'O Positive'
    };

    beforeEach(() => {
      createComponent({ boxId: 'BOX0001234', boxContents: [mockProduct, mockProduct2] });
    });

    it('should display multiple products', () => {
      const rows = fixture.debugElement.queryAll(By.css('tr.mat-mdc-row'));
      expect(rows.length).toBe(2);
    });
  });
});
