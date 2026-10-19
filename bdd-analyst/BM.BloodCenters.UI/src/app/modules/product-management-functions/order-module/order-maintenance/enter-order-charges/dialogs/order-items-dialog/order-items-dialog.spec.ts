import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';
import { SnackbarService } from '@shared/services/snackbar.service';

import { OrderItemsDialogComponent } from './order-items-dialog';
import { EnterOrderChargesApiService } from '../../services/enter-order-charges-api.service';
import { AttributesAntigensDialogComponent } from '../attributes-antigens-dialog/attributes-antigens-dialog';
import { OrderItemsDialogData, OrderItemDto } from '../../models/enter-order-charges.model';

describe('OrderItemsDialogComponent', () => {
  let component: OrderItemsDialogComponent;
  let fixture: ComponentFixture<OrderItemsDialogComponent>;
  let mockApiService: jasmine.SpyObj<EnterOrderChargesApiService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<OrderItemsDialogComponent>>;
  let mockDialog: jasmine.SpyObj<any>;

  const mockItems: OrderItemDto[] = [
    { itemNo: 1, product: 'Red Blood Cells', aboRh: 'O+', requiredQuantity: 5, canceledQuantity: 0, unitPrice: 200 },
    { itemNo: 2, product: 'Platelets', aboRh: 'A-', requiredQuantity: 3, canceledQuantity: 1, unitPrice: 150 },
  ];

  const dialogData: OrderItemsDialogData = {
    orderNo: 'ORD001',
    items: mockItems,
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('EnterOrderChargesApiService', ['getItemAttributesAntigens']);
    mockSnackbar = createMockSnackbarService();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDialog = createMockMatDialog();

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: EnterOrderChargesApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbar },
      ],
    }).overrideComponent(OrderItemsDialogComponent, {
      set: {
        imports: [CommonModule],
        template: '',
      },
    });

    fixture = TestBed.createComponent(OrderItemsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to dialog data', () => {
    expect(component.data.orderNo).toBe('ORD001');
    expect(component.data.items.length).toBe(2);
  });

  describe('itemsTableConfig', () => {
    it('should define 6 columns', () => {
      expect(component.itemsTableConfig.columns.length).toBe(6);
      expect(component.itemsTableConfig.columns.map(c => c.key)).toEqual([
        'itemNo', 'product', 'aboRh', 'requiredQuantity', 'canceledQuantity', 'unitPrice',
      ]);
    });

    it('should format unit price via valueFormatter', () => {
      const unitPriceCol = component.itemsTableConfig.columns.find(c => c.key === 'unitPrice');
      expect(unitPriceCol?.valueFormatter?.(200, {} as any)).toBe('$200.00');
      expect(unitPriceCol?.valueFormatter?.(null, {} as any)).toBe('$0.00');
    });

    it('should disable pagination', () => {
      expect(component.itemsTableConfig.showPagination).toBeFalse();
    });

    it('should show table on empty with message', () => {
      expect(component.itemsTableConfig.showTableOnEmpty).toBeTrue();
      expect(component.itemsTableConfig.emptyMessage).toBe('No items found.');
    });
  });

  describe('onCancel', () => {
    it('should close the dialog', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onAttributesAntigens', () => {
    it('should fetch attributes/antigens and open dialog on success', () => {
      const mockResponse = {
        success: true,
        item: {
          antigens: [{ itemNo: 1, antigen: 'A', result: 'Positive', unitPrice: 10 }],
          attributes: [{ itemNo: 1, group: 'Rh', code: 'D', unitPrice: 5 }],
        },
        message: '',
        statusCode: 200,
      };
      mockApiService.getItemAttributesAntigens.and.returnValue(of(mockResponse));

      component.onAttributesAntigens();

      expect(mockApiService.getItemAttributesAntigens).toHaveBeenCalledWith('ORD001');
      expect(mockDialog.open).toHaveBeenCalled();
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[0]).toBe(AttributesAntigensDialogComponent);
      expect(callArgs[1].data.antigens.length).toBe(1);
      expect(callArgs[1].data.attributes.length).toBe(1);
    });

    it('should handle null antigens and attributes in response', () => {
      mockApiService.getItemAttributesAntigens.and.returnValue(of({
        success: true,
        item: { antigens: null as any, attributes: null as any },
        message: '',
        statusCode: 200,
      }));

      component.onAttributesAntigens();

      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1].data.antigens).toEqual([]);
      expect(callArgs[1].data.attributes).toEqual([]);
    });

    it('should show error when API returns unsuccessful', () => {
      mockApiService.getItemAttributesAntigens.and.returnValue(of({
        success: false,
        message: 'No data found.',
        statusCode: 404,
      }));

      component.onAttributesAntigens();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('No data found.');
    });

    it('should show errorResponse error when available', () => {
      mockApiService.getItemAttributesAntigens.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 500,
        errorResponse: { errorCode: 'ERR', error: 'Server failure' },
      }));

      component.onAttributesAntigens();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Server failure');
    });

    it('should show error on API failure', () => {
      mockApiService.getItemAttributesAntigens.and.returnValue(throwError(() => new Error('Network error')));

      component.onAttributesAntigens();

      expect(mockDialog.open).not.toHaveBeenCalled();
      expect(mockSnackbar.showError).toHaveBeenCalled();
    });

    it('should open dialog with right panel configuration', () => {
      mockApiService.getItemAttributesAntigens.and.returnValue(of({
        success: true,
        item: { antigens: [], attributes: [] },
        message: '',
        statusCode: 200,
      }));

      component.onAttributesAntigens();

      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1].position).toEqual({ right: '0', top: '64px' });
      expect(callArgs[1].width).toBe('750px');
      expect(callArgs[1].height).toBe('calc(100vh - 64px)');
      expect(callArgs[1].panelClass).toBe('right-panel-dialog');
    });
  });
});
