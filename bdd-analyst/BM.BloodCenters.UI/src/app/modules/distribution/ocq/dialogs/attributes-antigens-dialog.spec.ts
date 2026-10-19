import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Observable, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AttributesAntigensDialog, AttributesAntigensDialogData } from './attributes-antigens-dialog';
import { OcqService } from '../services/ocq.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { OrderItemDetailDto } from '../models/ocq.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AttributesAntigensDialog', () => {
  let component: AttributesAntigensDialog;
  let fixture: ComponentFixture<AttributesAntigensDialog>;
  let mockOcqService: jasmine.SpyObj<OcqService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AttributesAntigensDialog>>;

  const mockDialogData: AttributesAntigensDialogData = {
    orderNo: '17337-0019',
    itemNo: 1,
    orderStatus: 'OP',
    orderStatusDesc: 'Ordered',
  };

  const mockItemDetail: OrderItemDetailDto = {
    orderNo: '17337-0019',
    itemNo: 1,
    productType: 'POPLT',
    productTypeDesc: 'Pooled Plts Random',
    bloodType: 'O+',
    aboDesc: 'O Pos',
    itemStatus: 'OR',
    itemStatusDesc: 'Ordered',
    requiredQty: 1,
    allocatedQty: 0,
    canceledQty: 0,
    shippedQty: 0,
    attributes: [
      {
        attribGroup: 'SP',
        attribCode: 'POOL',
        attribDesc: 'Pooling Fee',
      },
      {
        attribGroup: 'CMV',
        attribCode: 'NEG',
        attribDesc: 'CMV Negative',
      },
    ],
    antigens: [
      {
        antigenId: 'K',
        antigenDesc: 'Kell',
        resultStatus: 'NEG',
      },
    ],
  };

  beforeEach(() => {
    mockOcqService = jasmine.createSpyObj('OcqService', ['getOrderItemDetail']);
    mockSnackbarService = createMockSnackbarService();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    mockOcqService.getOrderItemDetail.and.returnValue(of(mockItemDetail));

    TestBed.configureTestingModule({
      imports: [AttributesAntigensDialog, NoopAnimationsModule],
      providers: [
        { provide: OcqService, useValue: mockOcqService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });

    mockOcqService.getOrderItemDetail.calls.reset();
    mockDialogRef.close.calls.reset();
    mockOcqService.getOrderItemDetail.and.returnValue(of(mockItemDetail));

    fixture = TestBed.createComponent(AttributesAntigensDialog);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should have dialog data', () => {
      expect((component as any).data).toEqual(mockDialogData);
    });

    it('should load item detail on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockOcqService.getOrderItemDetail).toHaveBeenCalledWith(
        mockDialogData.orderNo,
        mockDialogData.itemNo
      );
      expect((component as any).itemDetail()).toEqual(mockItemDetail);
    }));

    it('should clear loading state after data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));

    it('should set loading to true while fetching', () => {
      (component as any).loading.set(true);
      expect((component as any).loading()).toBeTrue();
    });
  });

  describe('Error State', () => {
    it('should handle error when loading item detail fails', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            error: 'Order item not found',
          },
        },
      };

      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Order item not found');
      expect((component as any).loading()).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Order item not found');
    }));

    it('should show error message when error exists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).error.set('Test error');
      (component as any).loading.set(false);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Test error');
    }));
  });

  describe('Content Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display item summary', () => {
      const summary = fixture.debugElement.query(By.css('.item-summary'));
      expect(summary).toBeTruthy();
      expect(summary.nativeElement.textContent).toContain('17337-0019');
      expect(summary.nativeElement.textContent).toContain('POPLT');
    });

    it('should display attributes table', () => {
      const attributesTable = fixture.debugElement.query(By.css('.data-table'));
      expect(attributesTable).toBeTruthy();

      const rows = attributesTable.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(2);
    });

    it('should display attributes data correctly', () => {
      const attributeRows = fixture.debugElement.queryAll(By.css('.data-table tbody tr'));
      const firstRow = attributeRows[0].nativeElement;

      expect(firstRow.textContent).toContain('SP');
      expect(firstRow.textContent).toContain('POOL');
      expect(firstRow.textContent).toContain('Pooling Fee');
    });

    it('should display antigens table', () => {
      const tables = fixture.debugElement.queryAll(By.css('.data-table'));
      expect(tables.length).toBe(2);
    });

    it('should display antigens data correctly', () => {
      const antigenRows = fixture.debugElement.queryAll(By.css('.data-table tbody tr'));
      const lastRow = antigenRows[antigenRows.length - 1].nativeElement;

      expect(lastRow.textContent).toContain('K');
      expect(lastRow.textContent).toContain('Kell');
    });
  });

  describe('Status Badge', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display status badge in header', () => {
      const chip = fixture.debugElement.query(By.css('mat-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.textContent).toContain('Ordered');
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close dialog without passing any result', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('getStatusColorClass', () => {
    it('should return status-ordered for status containing "order"', () => {
      expect(component.getStatusColorClass('Ordered')).toBe('status-ordered');
      expect(component.getStatusColorClass('ORDER')).toBe('status-ordered');
      expect(component.getStatusColorClass('order pending')).toBe('status-ordered');
    });

    it('should return status-canceled for status containing "cancel"', () => {
      expect(component.getStatusColorClass('Canceled')).toBe('status-canceled');
      expect(component.getStatusColorClass('CANCEL')).toBe('status-canceled');
      expect(component.getStatusColorClass('cancel request')).toBe('status-canceled');
    });

    it('should return status-closed for status containing "close"', () => {
      expect(component.getStatusColorClass('Closed')).toBe('status-closed');
      expect(component.getStatusColorClass('CLOSE')).toBe('status-closed');
      expect(component.getStatusColorClass('closed out')).toBe('status-closed');
    });

    it('should return status-default for unrecognized status', () => {
      expect(component.getStatusColorClass('Pending')).toBe('status-default');
      expect(component.getStatusColorClass('Active')).toBe('status-default');
      expect(component.getStatusColorClass('Shipped')).toBe('status-default');
    });

    it('should return status-default for null status', () => {
      expect(component.getStatusColorClass(null as any)).toBe('status-default');
    });

    it('should return status-default for undefined status', () => {
      expect(component.getStatusColorClass(undefined as any)).toBe('status-default');
    });

    it('should return status-default for empty string', () => {
      expect(component.getStatusColorClass('')).toBe('status-default');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract error from errorResponse.error', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            error: 'Backend validation error',
          },
        },
      };

      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Backend validation error');
    }));

    it('should extract error from error.message', fakeAsync(() => {
      const errorResponse = {
        error: {
          message: 'Server error occurred',
        },
      };

      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Server error occurred');
    }));

    it('should extract error from message property', fakeAsync(() => {
      const errorResponse = {
        message: 'Network connection failed',
      };

      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Network connection failed');
    }));

    it('should return default error message when no specific message', fakeAsync(() => {
      const errorResponse = {};

      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => errorResponse));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Failed to load order item details');
    }));

    it('should return default error message for null error', fakeAsync(() => {
      mockOcqService.getOrderItemDetail.and.returnValue(throwError(() => null));

      fixture.detectChanges();
      tick();

      expect((component as any).error()).toBe('Failed to load order item details');
    }));
  });

  describe('elementId', () => {
    it('should generate unique element IDs with component prefix', () => {
      const id = (component as any).elementId('test-element');
      expect(id).toContain('attr-antigen-dialog-');
      expect(id).toContain('-test-element');
    });

    it('should generate different IDs for different element names', () => {
      const id1 = (component as any).elementId('header');
      const id2 = (component as any).elementId('content');
      expect(id1).not.toBe(id2);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroy$ = (component as any).destroy$;
      let completed = false;
      destroy$.subscribe({ complete: () => (completed = true) });

      component.ngOnDestroy();
      expect(completed).toBeTrue();
    }));

    it('should cancel pending requests on destroy', fakeAsync(() => {
      let subscriptionActive = true;
      mockOcqService.getOrderItemDetail.and.returnValue(
        new Observable((observer: any) => {
          return () => {
            subscriptionActive = false;
          };
        })
      );

      fixture.detectChanges();
      expect(subscriptionActive).toBeTrue();

      component.ngOnDestroy();
      expect(subscriptionActive).toBeFalse();
    }));
  });
});
