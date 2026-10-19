import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import moment from 'moment';

import { SpOpenOrdersDialogComponent, SpOpenOrdersDialogData } from './sp-open-orders-dialog';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

describe('SpOpenOrdersDialogComponent', () => {
  let component: SpOpenOrdersDialogComponent;
  let fixture: ComponentFixture<SpOpenOrdersDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SpOpenOrdersDialogComponent>>;
  let chapterTimezoneSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDialogData: SpOpenOrdersDialogData = {
    customerId: 'CUST-001',
    orders: [
      {
        orderNumber: 'SO-001',
        item: 1,
        productType: 'RBC',
        abORh: 'A+',
        quantityRequired: 5,
        quantityAl: 2,
        date: '2025-06-15T10:30:00Z',
        hours: 24,
        attribute: 'ATTR1',
        antigenId: 'Fya'
      }
    ]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    chapterTimezoneSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal']);

    // Default: convertGmtToLocal returns the moment as-is (no offset)
    chapterTimezoneSpy.convertGmtToLocal.and.callFake((m: any) => m.clone());

    TestBed.configureTestingModule({
      imports: [
        SpOpenOrdersDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(SpOpenOrdersDialogComponent);
    component = fixture.componentInstance;
  });

  // ---- Component creation ----

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have dialog data injected', () => {
    expect(component.data).toBeDefined();
    expect(component.data).toEqual(mockDialogData);
  });

  // ---- Data display ----

  it('should have correct customerId from data', () => {
    expect(component.data.customerId).toBe('CUST-001');
  });

  it('should have orders array from data', () => {
    expect(component.data.orders).toBeDefined();
    expect(component.data.orders.length).toBe(1);
    expect(component.data.orders[0].orderNumber).toBe('SO-001');
  });

  // ---- Gap #10: formatDate method converts UTC to chapter timezone ----

  describe('formatDate (Gap #10)', () => {
    it("should return '--' for empty date string", () => {
      expect(component.formatDate('')).toBe('--');
    });

    it("should return '--' for null/undefined date string", () => {
      expect(component.formatDate(null as any)).toBe('--');
      expect(component.formatDate(undefined as any)).toBe('--');
    });

    it('should return original string for invalid date', () => {
      const invalid = 'not-a-date';
      expect(component.formatDate(invalid)).toBe(invalid);
    });

    it('should convert valid UTC date using chapterTimezoneService.convertGmtToLocal', () => {
      const dateStr = '2025-06-15T10:30:00Z';
      component.formatDate(dateStr);
      expect(chapterTimezoneSpy.convertGmtToLocal).toHaveBeenCalled();
    });

    it('should call convertGmtToLocal with UTC moment', () => {
      const dateStr = '2025-06-15T10:30:00Z';
      component.formatDate(dateStr);

      const arg = chapterTimezoneSpy.convertGmtToLocal.calls.mostRecent().args[0];
      // The argument should be a moment object created via moment.utc()
      expect(moment.isMoment(arg)).toBeTrue();
      expect(arg.utc().format()).toBe('2025-06-15T10:30:00Z');
    });

    it("should format date as 'D-MMM-YYYY, hh:mm A' in uppercase", () => {
      // Mock convertGmtToLocal to return a known fixed moment
      const fixedMoment = moment.utc('2025-06-15T10:30:00Z');
      chapterTimezoneSpy.convertGmtToLocal.and.returnValue(fixedMoment);

      const result = component.formatDate('2025-06-15T10:30:00Z');
      // moment format 'D-MMM-YYYY, hh:mm A' for 2025-06-15T10:30:00Z => '15-Jun-2025, 10:30 AM'
      // .toUpperCase() => '15-JUN-2025, 10:30 AM'
      expect(result).toBe('15-JUN-2025, 10:30 AM');
    });

    it('should handle date with timezone offset correctly', () => {
      // Simulate a chapter timezone offset: convertGmtToLocal shifts by -5 hours (EST)
      chapterTimezoneSpy.convertGmtToLocal.and.callFake((m: any) => {
        return m.clone().subtract(5, 'hours');
      });

      const result = component.formatDate('2025-06-15T10:30:00Z');
      // 10:30 UTC - 5h = 05:30 AM on same day
      expect(result).toBe('15-JUN-2025, 05:30 AM');
    });
  });

  // ---- onClose ----

  describe('onClose', () => {
    it('should call dialogRef.close()', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should call dialogRef.close without arguments', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  // ---- Edge cases ----

  describe('Edge cases', () => {
    it('should handle empty orders array', () => {
      const emptyData: SpOpenOrdersDialogData = { customerId: 'CUST-002', orders: [] };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [SpOpenOrdersDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: emptyData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ChapterTimezoneService, useValue: chapterTimezoneSpy }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      });

      const emptyFixture = TestBed.createComponent(SpOpenOrdersDialogComponent);
      const emptyComponent = emptyFixture.componentInstance;

      expect(emptyComponent).toBeTruthy();
      expect(emptyComponent.data.orders.length).toBe(0);
    });

    it('should handle data with single order', () => {
      expect(component.data.orders.length).toBe(1);
      const order = component.data.orders[0];
      expect(order.orderNumber).toBe('SO-001');
      expect(order.item).toBe(1);
      expect(order.productType).toBe('RBC');
      expect(order.abORh).toBe('A+');
      expect(order.quantityRequired).toBe(5);
      expect(order.quantityAl).toBe(2);
      expect(order.hours).toBe(24);
      expect(order.attribute).toBe('ATTR1');
      expect(order.antigenId).toBe('Fya');
    });
  });
});
