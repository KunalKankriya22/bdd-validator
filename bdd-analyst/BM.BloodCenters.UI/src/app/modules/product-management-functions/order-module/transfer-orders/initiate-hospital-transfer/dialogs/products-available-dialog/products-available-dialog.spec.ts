import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { ProductsAvailableDialogComponent } from './products-available-dialog';
import { InitiateHospitalTransferApiService } from '../../services/initiate-hospital-transfer-api.service';
import {
  ProductsAvailableDialogData,
  ProductAvailableDto,
} from '../../models/initiate-hospital-transfer.model';

describe('ProductsAvailableDialogComponent', () => {
  let component: ProductsAvailableDialogComponent;
  let fixture: ComponentFixture<ProductsAvailableDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProductsAvailableDialogComponent>>;
  let matDialog: MatDialog;
  let apiServiceSpy: jasmine.SpyObj<InitiateHospitalTransferApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockProducts: ProductAvailableDto[] = [
    { fromHospital: 'HOP-CS0001', unitId: 'U001', productCode: 'E0385V00', productType: 'RBC', aboRh: 'B Negative', expirationDate: '05-MAR-2010', transferSlipSelected: '', contactPerson: 'AILEEN VALE', phoneNumber: '439-4043' },
    { fromHospital: 'HOP-CS0001', unitId: 'U002', productCode: 'E0385V00', productType: 'RBC', aboRh: 'O Negative', expirationDate: '03-MAR-2010', transferSlipSelected: '', contactPerson: 'AILEEN VALE', phoneNumber: '439-4043' },
    { fromHospital: 'PAR-CS0001', unitId: 'U003', productCode: 'E0385V00', productType: 'RBC', aboRh: 'O Negative', expirationDate: '03-MAR-2010', transferSlipSelected: '', contactPerson: 'BOB SMITH', phoneNumber: '555-1234' },
  ];

  const mockDialogData: ProductsAvailableDialogData = {
    orderNo: 'ORD-001',
    header: {
      itemNo: 1,
      productType: 'RBC - Red Blood Cells',
      quantityNeed: 2,
      hospitalName: 'HOPKINS COUNTY MEMORIAL HOSPITAL',
      contactPerson: 'AILEEN VALE',
      phoneNumber: '439-4043',
      quantityAvailable: 3,
      products: mockProducts,
    },
  };

  function createConfirmDialogRefSpy(confirmed: boolean) {
    const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(confirmed));
    return ref;
  }

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('InitiateHospitalTransferApiService', ['printTransferSlip']);
    snackbarSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [ProductsAvailableDialogComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: InitiateHospitalTransferApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsAvailableDialogComponent);
    component = fixture.componentInstance;
    matDialog = TestBed.inject(MatDialog);
    fixture.detectChanges();
  });

  afterEach(() => {
    matDialog.closeAll();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize sortedProducts from dialog data', () => {
    expect(component.sortedProducts.length).toBe(3);
  });

  describe('maxSelectable', () => {
    it('should return min of quantityNeed and products length', () => {
      expect(component.maxSelectable).toBe(2);
    });
  });

  describe('isAllSelected', () => {
    it('should return false when nothing selected', () => {
      expect(component.isAllSelected()).toBeFalse();
    });

    it('should return true when maxSelectable items selected', () => {
      component.selection.select(mockProducts[0], mockProducts[1]);
      expect(component.isAllSelected()).toBeTrue();
    });
  });

  describe('toggleProduct', () => {
    it('should select a product', () => {
      component.toggleProduct(mockProducts[0]);
      expect(component.selection.isSelected(mockProducts[0])).toBeTrue();
    });

    it('should deselect an already selected product', () => {
      component.selection.select(mockProducts[0]);
      component.toggleProduct(mockProducts[0]);
      expect(component.selection.isSelected(mockProducts[0])).toBeFalse();
    });

    it('should show error when selecting more than quantityNeed', () => {
      component.selection.select(mockProducts[0], mockProducts[1]);
      component.toggleProduct(mockProducts[2]);
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0248'),
      );
      expect(component.selection.isSelected(mockProducts[2])).toBeFalse();
    });
  });

  describe('toggleAllRows', () => {
    it('should select up to quantityNeed products', () => {
      component.toggleAllRows();
      expect(component.selection.selected.length).toBe(2);
    });

    it('should show error when products exceed quantityNeed', () => {
      component.toggleAllRows();
      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0248'),
      );
    });

    it('should clear selection when all already selected', () => {
      component.selection.select(mockProducts[0], mockProducts[1]);
      component.toggleAllRows();
      expect(component.selection.selected.length).toBe(0);
    });
  });

  describe('onSort', () => {
    it('should sort products ascending', () => {
      component.onSort({ active: 'unitId', direction: 'asc' });
      expect(component.sortedProducts[0].unitId).toBe('U001');
    });

    it('should sort products descending', () => {
      component.onSort({ active: 'unitId', direction: 'desc' });
      expect(component.sortedProducts[0].unitId).toBe('U003');
    });

    it('should reset to original order when direction is empty', () => {
      component.onSort({ active: 'unitId', direction: '' });
      expect(component.sortedProducts.length).toBe(3);
    });

    it('should preserve all products after sort', () => {
      component.onSort({ active: 'fromHospital', direction: 'asc' });
      expect(component.sortedProducts.length).toBe(3);
    });
  });

  describe('onCancel', () => {
    it('should close the dialog', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('onPrintTransferSlip', () => {
    it('should open confirm dialog and call API when confirmed', fakeAsync(() => {
      const dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(createConfirmDialogRefSpy(true));
      apiServiceSpy.printTransferSlip.and.returnValue(of({
        success: true, message: 'OK', statusCode: 201,
        item: { transferSlipNumber: 'TS-001' },
      } as any));

      component.selection.select(mockProducts[0]);
      component.onPrintTransferSlip();
      tick();

      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(apiServiceSpy.printTransferSlip).toHaveBeenCalledWith({
        orderNo: 'ORD-001',
        itemNo: 1,
        unitIds: ['U001'],
      });
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('TS-001'),
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should not call API when user cancels confirmation', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue(createConfirmDialogRefSpy(false));
      component.onPrintTransferSlip();
      tick();
      expect(apiServiceSpy.printTransferSlip).not.toHaveBeenCalled();
    }));

    it('should show error when print transfer slip API returns failure', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue(createConfirmDialogRefSpy(true));
      apiServiceSpy.printTransferSlip.and.returnValue(of({
        success: false, message: 'Transfer failed', statusCode: 400,
      } as any));

      component.selection.select(mockProducts[0]);
      component.onPrintTransferSlip();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should show error when API throws', fakeAsync(() => {
      spyOn((component as any).dialog, 'open').and.returnValue(createConfirmDialogRefSpy(true));
      apiServiceSpy.printTransferSlip.and.returnValue(throwError(() => new Error('Network error')));

      component.selection.select(mockProducts[0]);
      component.onPrintTransferSlip();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });
});
