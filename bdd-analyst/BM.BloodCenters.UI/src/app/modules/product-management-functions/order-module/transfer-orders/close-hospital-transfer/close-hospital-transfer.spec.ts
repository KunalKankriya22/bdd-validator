import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { CloseHospitalTransferComponent } from './close-hospital-transfer';
import { CloseHospitalTransferApiService } from './services/close-hospital-transfer-api.service';
import { TransferProductRow, ActionTakenValue } from './models/close-hospital-transfer.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CloseHospitalTransferComponent', () => {
  let p: any;
  let request: any;
  let product: any;
  let headerServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let component: CloseHospitalTransferComponent;
  let fixture: ComponentFixture<CloseHospitalTransferComponent>;
  let apiServiceSpy: jasmine.SpyObj<CloseHospitalTransferApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockOpenSlips = [
    { pickSlipId: 'PTI-00036', insertDate: '2026-01-12T13:15:00', pickSlipType: 'XR', sourceHospitalName: 'Parkland Hospital', destinationHospitalName: 'Guam Memorial', transferType: 'Regular', productCount: 2 },
    { pickSlipId: 'PTI-00037', insertDate: '2026-01-13T10:00:00', pickSlipType: 'XA', sourceHospitalName: 'Dallas Hospital', destinationHospitalName: 'Austin Hospital', transferType: 'Auto/Direct', productCount: 1 },
  ];

  const mockProducts = [
    { pickSlipId: 'PTI-00036', unitId: 'W1234-18-031310-Z', displayUnitId: 'W1234-18-031310-Z', productCode: 'E51665V00', bloodType: 'O+', expDate: '2026-01-12T13:15:00', aboDescription: 'O Positive', productType: 'RBC', aliquot: '01', collDate: '2026-01-01', chapterId: 'DAL', pickSlipType: 'XR', pickSlipStatus: 'OP', orderNo: 'ORD001', itemNo: 1, sourceHospital: 'CS001', tier: null, qcFlag: null, insertDate: null, sourceHospitalName: 'Parkland Hospital', sourceHospitalAddress: '1234 Medical District Drive, Suite 250', sourceCityStateZip: 'Dallas, TX 75235, United States', destinationHospitalName: 'Guam Memorial Hospital', destinationHospitalAddress: '543 Medical District Drive, Suite 250', destCityStateZip: 'Dallas, TX 75235, United States', productDescription: 'Red Blood Cells' },
  ];

  const apiResponse = <T>(data: T) => ({
    success: true, message: '', statusCode: 200, data: data as any,
  });

  const apiItemResponse = <T>(item: T) => ({
    success: true, message: '', statusCode: 200, item: item as any,
  });

  const apiErrorResponse = (message: string) => ({
    success: false, message, statusCode: 400, data: [] as any,
  });

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CloseHospitalTransferApiService', [
      'getOpenTransferSlips', 'getTransferProducts', 'closeTransfer',
      'getProductCodeLov', 'getAliquotLov', 'getAboRhLov',
    ]);
    snackbarServiceSpy = createMockSnackbarService();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    headerServiceSpy = createMockHeaderService();

    apiServiceSpy.getOpenTransferSlips.and.returnValue(of(apiResponse(mockOpenSlips)));
    apiServiceSpy.getTransferProducts.and.returnValue(of(apiResponse(mockProducts)));
    apiServiceSpy.closeTransfer.and.returnValue(of(apiItemResponse({ pickSlipId: 'PTI-00036', status: 'CL', productsProcessed: 1, productsDiscarded: 0, orderStatus: 'CL', message: 'Transfer closed successfully.' })));
    apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([{ productCode: 'E51665V00', productDescription: 'Red Blood Cells' }])));
    apiServiceSpy.getAliquotLov.and.returnValue(of(apiResponse([{ aliquot: '01' }])));
    apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([{ bloodType: 'O+', aboDescription: 'O Positive' }])));



      TestBed.configureTestingModule({
      imports: [CloseHospitalTransferComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CloseHospitalTransferApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });
      apiServiceSpy.getOpenTransferSlips.and.returnValue(of(apiResponse(mockOpenSlips)));


      apiServiceSpy.getTransferProducts.and.returnValue(of(apiResponse(mockProducts)));


      apiServiceSpy.closeTransfer.and.returnValue(of(apiItemResponse({ pickSlipId: 'PTI-00036', status: 'CL', productsProcessed: 1, productsDiscarded: 0, orderStatus: 'CL', message: 'Transfer closed successfully.' })));


      apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([{ productCode: 'E51665V00', productDescription: 'Red Blood Cells' }])));


      apiServiceSpy.getAliquotLov.and.returnValue(of(apiResponse([{ aliquot: '01' }])));


      apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([{ bloodType: 'O+', aboDescription: 'O Positive' }])));


    fixture = TestBed.createComponent(CloseHospitalTransferComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load open transfer slips on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getOpenTransferSlips).toHaveBeenCalledTimes(1);
    });

    it('should have empty state on init', () => {
      fixture.detectChanges();
      expect(component.products).toEqual([]);
      expect(component.hasRetrieved).toBeFalse();
      expect(component.creationDate()).toBe('-');
      expect(component.sourceHospitalName()).toBe('');
      expect(component.sourceHospitalAddress()).toBe('');
      expect(component.destinationHospitalName()).toBe('');
      expect(component.destinationHospitalAddress()).toBe('');
    });



    it('should handle open slips API error gracefully', fakeAsync(() => {
      apiServiceSpy.getOpenTransferSlips.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingSlips).toBeFalse();
      expect(component.transferSlipOptions().length).toBe(0);
    }));
  });

  describe('Transfer Slip Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update creation date when slip is selected via dialog', fakeAsync(() => {
      const selected = mockOpenSlips[0] as any;
      component.transferSlipCtrl.setValue(selected.pickSlipId);
      component.selectedSlipDisplay.set(selected.pickSlipId);
      component.creationDate.set(component.formatExpDate(selected.insertDate));
      tick();
      expect(component.creationDate()).toBe('12-JAN-2026 13:15');
    }));

    it('should reset creation date when cleared', fakeAsync(() => {
      component.creationDate.set('12-JAN-2026 13:15');
      component.onClearAll();
      tick();
      expect(component.creationDate()).toBe('-');
    }));
  });





  describe('Action Taken', () => {
    let product: TransferProductRow;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      product = component.products[0];
    }));

    it('should set action on product', () => {
      component.onActionChange(product, 'O');
      expect(product.actionTaken).toBe('O');
    });

    it('should block Modify on XA transfer type', () => {
      component.transferType = 'XA';
      component.onActionChange(product, 'M');
      expect(product.actionTaken).toBe('');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot modify products on Auto/Direct transfers.');
    });

    it('should start with empty fields when Modify is selected', fakeAsync(() => {
      component.onActionChange(product, 'M');
      tick();
      expect(product.modifiedUnitId).toBe('');
      expect(product.modifiedProductCode).toBe('');
      expect(product.modifiedAliquot).toBe('');
      expect(product.modifiedBloodType).toBe('');
      expect(product.modifiedExpDate).toBe('');
    }));



    it('should load product code LOV after unit ID is validated', fakeAsync(() => {
      component.onActionChange(product, 'M');
      tick();
      component.onUnitValidated(product, { parsedUnitId: 'NEW-UNIT', codeScheme: 'I' } as any);
      tick();
      expect(product.modifiedUnitId).toBe('NEW-UNIT');
      expect(apiServiceSpy.getProductCodeLov).toHaveBeenCalled();
    }));

    it('should clear modify fields when switching away from Modify', fakeAsync(() => {
      component.onActionChange(product, 'M');
      tick();
      component.onActionChange(product, 'O');
      expect(product.modifiedUnitId).toBe('');
      expect(product.modifiedProductCode).toBe('');
      expect(product.modifiedAliquot).toBe('');
      expect(product.modifiedBloodType).toBe('');
      expect(product.modifiedExpDate).toBe('');
    }));
  });

  describe('Cancel', () => {
    it('should reset actions but keep products and hospital info', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();

      component.products[0].actionTaken = 'O';
      component.onCancel();

      expect(component.products[0].actionTaken).toBe('');
      expect(component.products[0].modifiedUnitId).toBe('');
      expect(component.products.length).toBe(1);
      expect(component.transferSlipCtrl.value).toBe('PTI-00036');
      expect(component.sourceHospitalName()).toBe('Parkland Hospital');
      expect(component.hasRetrieved).toBeTrue();
    }));
  });

  describe('Save', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
    }));



    it('should call closeTransfer with correct request for Transferred without original fields', fakeAsync(() => {
      component.products[0].actionTaken = 'O';
      component.onSave();
      tick();
      expect(apiServiceSpy.closeTransfer).toHaveBeenCalled();
      request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      expect(request.pickSlipId).toBe('PTI-00036');
      expect(request.products[0].qcFlag).toBe('O');
      expect(request.products[0].unitId).toBe('W1234-18-031310-Z');
      expect(request.products[0].originalUnitId).toBeUndefined();
      expect(request.products[0].originalProductCode).toBeUndefined();
      expect(request.products[0].originalAliquot).toBeUndefined();
    }));

    it('should include modified values and original identifiers for Modify products', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      p = component.products[0];
      p.modifiedUnitId = 'NEW-UNIT';
      p.modifiedProductCode = 'NEW-CODE';
      p.modifiedBloodType = 'A+';
      p.modifiedExpDate = '15-JUN-2026 10:00';
      component.onSave();
      tick();
      request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      product = request.products[0];
      expect(product.qcFlag).toBe('M');
      expect(product.unitId).toBe('NEW-UNIT');
      expect(product.productCode).toBe('NEW-CODE');
      expect(product.bloodType).toBe('A+');
      expect(product.expDate).toBe('15-JUN-2026 10:00');
      expect(product.originalUnitId).toBe('W1234-18-031310-Z');
      expect(product.originalProductCode).toBe('E51665V00');
      expect(product.originalAliquot).toBe('01');
    }));



    it('should reset saving state on save failure without showing snackbar', fakeAsync(() => {
      apiServiceSpy.closeTransfer.and.returnValue(throwError(() => ({ status: 500 })));
      component.products[0].actionTaken = 'O';
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));
  });

  describe('isReadyToSave', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should return false when no actions set', () => {
      expect(component.isReadyToSave()).toBeFalse();
    });

    it('should return true for Transferred action', () => {
      component.products[0].actionTaken = 'O';
      expect(component.isReadyToSave()).toBeTrue();
    });

    it('should return true for Deallocate action', () => {
      component.products[0].actionTaken = 'D';
      expect(component.isReadyToSave()).toBeTrue();
    });

    it('should return false for Modify with empty fields', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      expect(component.isReadyToSave()).toBeFalse();
    }));

    it('should return true for Modify with all fields filled', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      p = component.products[0];
      p.modifiedUnitId = 'NEW-UNIT';
      p.modifiedProductCode = 'E51665V00';
      p.modifiedAliquot = '01';
      p.modifiedBloodType = 'O+';
      p.modifiedExpDate = '12-JAN-2026 13:15';
      expect(component.isReadyToSave()).toBeTrue();
    }));
  });
  describe('Chapter Changes', () => {
    it('should clear and reload slips on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      chapterChangedSubject.next();
      tick();

      expect(component.hasRetrieved).toBeFalse();
      expect(component.products).toEqual([]);
      expect(apiServiceSpy.getOpenTransferSlips).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Utility Methods', () => {
    beforeEach(() => fixture.detectChanges());

    it('hasAnyFieldValue should return false when no slip selected', () => {
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('hasAnyFieldValue should return true when slip selected', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      expect(component.hasAnyFieldValue()).toBeTrue();
    }));

    it('formatDate should format ISO date without time', () => {
      const result = component.formatDate('2026-01-12T13:15:00');
      expect(result).toMatch(/12-JAN-2026/i);
    });

    it('formatExpDate should format ISO date with time', () => {
      const result = component.formatExpDate('2026-01-12T13:15:00');
      expect(result).toMatch(/12-JAN-2026 13:15/i);
    });

    it('formatDate should return "-" for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('formatExpDate should return "-" for null', () => {
      expect(component.formatExpDate(null)).toBe('-');
    });

    it('trackByUnitId should return composite key', () => {
      const row = { unitId: 'U1', productCode: 'P1', aliquot: '01' } as any;
      expect(component.trackByUnitId(0, row)).toBe('U1-P1-01');
    });

    it('hasAnyAction should return false with no actions', () => {
      expect(component.hasAnyAction()).toBeFalse();
    });

    it('getSortIcon should return arrow_upward for ASC', () => {
      component.sortDirection = 'ASC';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });

    it('getSortIcon should return arrow_downward for DESC', () => {
      component.sortDirection = 'DESC';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });
  });

  describe('Coverage Gap Tests', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when retrieving without selecting a slip', () => {
      component.transferSlipCtrl.setValue('');
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a Transfer Slip ID.');
    });

    it('should handle retrieve with response.success=false', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      apiServiceSpy.getTransferProducts.and.returnValue(of({
        success: false, message: 'Products not found', statusCode: 400, data: [] as any
      }));
      component.onRetrieve();
      tick();
      expect(component.products).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Products not found');
    }));

    it('should handle retrieve API error', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      apiServiceSpy.getTransferProducts.and.returnValue(throwError(() => ({ status: 500 })));
      component.onRetrieve();
      tick();
      expect(component.isLoadingProducts).toBeFalse();
      expect(component.products).toEqual([]);
    }));

    it('should toggle sort direction and re-retrieve', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.onSortToggle();
      tick();
      expect(component.sortDirection).toBe('DESC');
      expect(apiServiceSpy.getTransferProducts).toHaveBeenCalledTimes(2);
    }));

    it('should not re-retrieve on sort toggle if not retrieved yet', () => {
      component.hasRetrieved = false;
      component.onSortToggle();
      expect(component.sortDirection).toBe('DESC');
    });

    it('should save with no pickSlipId (early return)', () => {
      component.transferSlipCtrl.setValue('');
      component.onSave();
      expect(apiServiceSpy.closeTransfer).not.toHaveBeenCalled();
    });

    it('should show error when saving with no actions selected', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.products.forEach(p => p.actionTaken = '' as any);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select an action for at least one product.');
    }));

    it('should handle save with response.success=false', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.products[0].actionTaken = 'O';
      apiServiceSpy.closeTransfer.and.returnValue(of({
        success: false, message: 'Failed to close transfer.', statusCode: 400, item: null as any
      }));
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to close transfer.');
    }));

    it('should clear modify fields on onUnitCleared', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.modifiedUnitId = 'SOME-ID';
      component.onUnitCleared(product);
      expect(product.modifiedUnitId).toBe('');
      expect(product.productCodeOptions).toEqual([]);
    }));

    it('should update product code and load ABO/Rh', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      component.onProductCodeChange(product, 'NEW-CODE');
      tick();
      expect(product.modifiedProductCode).toBe('NEW-CODE');
      expect(apiServiceSpy.getAboRhLov).toHaveBeenCalled();
    }));

    it('should set modifiedProductDescription from selected product code option', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.productCodeOptions = [
        { productCode: 'P1', productDescription: 'Red Blood Cells' },
        { productCode: 'P2', productDescription: 'Platelets' },
      ];
      component.onProductCodeChange(product, 'P2');
      tick();
      expect(product.modifiedProductDescription).toBe('Platelets');
    }));

    it('should clear modifiedProductDescription when product code is empty', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.modifiedProductDescription = 'Old Description';
      component.onProductCodeChange(product, '');
      tick();
      expect(product.modifiedProductDescription).toBe('');
    }));

    it('should not load ABO/Rh when product code is empty', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      apiServiceSpy.getAboRhLov.calls.reset();
      component.onProductCodeChange(product, '');
      tick();
      expect(apiServiceSpy.getAboRhLov).not.toHaveBeenCalled();
    }));

    it('should update ABO/Rh values on change', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.aboRhOptions = [{ bloodType: 'O+', aboDescription: 'O Positive' }];
      component.onAboRhChange(product, 'O+');
      expect(product.modifiedBloodType).toBe('O+');
      expect(product.modifiedAboDescription).toBe('O Positive');
    }));

    it('should handle onExpDateInput with valid date', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      const event = { target: { value: '15-JAN-2026 13:15' } } as any;
      component.onExpDateInput(product, event);
      expect(product.modifiedExpDate).toBe('15-JAN-2026 13:15');
      expect(product.expDateError).toBe('');
    }));

    it('hasAnyAction should return true when product has action', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.products[0].actionTaken = 'O';
      expect(component.hasAnyAction()).toBeTrue();
    }));

    it('should have transfer slip options available', fakeAsync(() => {
      tick();
      expect(component.transferSlipOptions().length).toBe(2);
    }));

    it('should set creation date to - for slip without insertDate', fakeAsync(() => {
      const slipNoDate = { pickSlipId: 'PTI-00099', insertDate: null as any, pickSlipType: 'XR', sourceHospitalName: '', destinationHospitalName: '', transferType: '', productCount: 0 };
      component.transferSlipCtrl.setValue(slipNoDate.pickSlipId);
      if (slipNoDate.insertDate) {
        component.creationDate.set(component.formatExpDate(slipNoDate.insertDate));
      } else {
        component.creationDate.set('-');
      }
      tick();
      expect(component.creationDate()).toBe('-');
    }));

    it('should handle productCodeLov error', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      apiServiceSpy.getProductCodeLov.and.returnValue(throwError(() => ({ status: 500 })));
      component.onActionChange(product, 'M');
      tick();
      component.onUnitValidated(product, { parsedUnitId: 'U1', codeScheme: 'C' } as any);
      tick();
      expect(product.isLoadingProductCodes).toBeFalse();
      expect(product.productCodeOptions).toEqual([]);
    }));

    it('should handle aboRhLov error', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      apiServiceSpy.getAboRhLov.and.returnValue(throwError(() => ({ status: 500 })));
      component.onProductCodeChange(product, 'NEW');
      tick();
      expect(product.isLoadingAboRh).toBeFalse();
      expect(product.aboRhOptions).toEqual([]);
    }));
  });

  describe('Save Success Flow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should clear form and reload slips after successful save', fakeAsync(() => {
      component.products[0].actionTaken = 'O';
      apiServiceSpy.getOpenTransferSlips.calls.reset();
      component.onSave();
      tick();
      expect(component.hasRetrieved).toBeFalse();
      expect(component.products).toEqual([]);
      expect(component.transferSlipCtrl.value).toBe('');
      expect(apiServiceSpy.getOpenTransferSlips).toHaveBeenCalledTimes(1);
    }));

    it('should show success snackbar message from API response', fakeAsync(() => {
      component.products[0].actionTaken = 'O';
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Transfer closed successfully.');
    }));

    it('should show default success message when API response has no message', fakeAsync(() => {
      apiServiceSpy.closeTransfer.and.returnValue(of({
        success: true, message: '', statusCode: 200, item: { pickSlipId: 'PTI-00036', status: 'CL', productsProcessed: 1, productsDiscarded: 0, orderStatus: 'CL', message: '' } as any
      }));
      component.products[0].actionTaken = 'O';
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Transfer closed successfully.');
    }));
  });

  describe('Hospital Info Population', () => {
    beforeEach(() => fixture.detectChanges());

    it('should populate hospital names and addresses from first product', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      expect(component.sourceHospitalName()).toBe('Parkland Hospital');
      expect(component.sourceHospitalAddress()).toBe('1234 Medical District Drive, Suite 250, Dallas, TX 75235, United States');
      expect(component.destinationHospitalName()).toBe('Guam Memorial Hospital');
      expect(component.destinationHospitalAddress()).toBe('543 Medical District Drive, Suite 250, Dallas, TX 75235, United States');
    }));

    it('should handle products with missing address parts', fakeAsync(() => {
      apiServiceSpy.getTransferProducts.and.returnValue(of(apiResponse([{
        ...mockProducts[0],
        sourceHospitalAddress: '',
        sourceCityStateZip: 'Dallas, TX 75235',
        destinationHospitalAddress: null,
        destCityStateZip: null,
      }])));
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      expect(component.sourceHospitalAddress()).toBe('Dallas, TX 75235');
      expect(component.destinationHospitalAddress()).toBe('');
    }));

    it('should not populate hospital info when products are empty', fakeAsync(() => {
      apiServiceSpy.getTransferProducts.and.returnValue(of(apiResponse([])));
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      expect(component.sourceHospitalName()).toBe('');
      expect(component.destinationHospitalName()).toBe('');
    }));
  });

  describe('LOV Auto-Selection Logic', () => {
    let product: TransferProductRow;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
    }));

    it('should auto-select product code and description when only one option returned', fakeAsync(() => {
      apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([
        { productCode: 'ONLY-CODE', productDescription: 'Only Option' },
      ])));
      component.onUnitValidated(product, { parsedUnitId: 'NEW-U', codeScheme: 'C' } as any);
      tick();
      expect(product.modifiedProductCode).toBe('ONLY-CODE');
      expect(product.modifiedProductDescription).toBe('Only Option');
    }));

    it('should not auto-select product code when multiple options returned', fakeAsync(() => {
      apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([
        { productCode: 'CODE-A', productDescription: 'A' },
        { productCode: 'CODE-B', productDescription: 'B' },
      ])));
      component.onUnitValidated(product, { parsedUnitId: 'NEW-U', codeScheme: 'C' } as any);
      tick();
      expect(product.modifiedProductCode).toBe('');
    }));

    it('should clear stale product code and description when not in new options', fakeAsync(() => {
      product.modifiedProductCode = 'OLD-CODE';
      product.modifiedProductDescription = 'Old Description';
      apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([
        { productCode: 'NEW-CODE', productDescription: 'New' },
      ])));
      component.onUnitValidated(product, { parsedUnitId: 'NEW-U', codeScheme: 'C' } as any);
      tick();
      expect(product.modifiedProductCode).toBe('');
      expect(product.modifiedProductDescription).toBe('');
    }));

    it('should chain loadAboRhLov when product code is already set after LOV loads', fakeAsync(() => {
      apiServiceSpy.getProductCodeLov.and.returnValue(of(apiResponse([
        { productCode: 'ONLY-CODE', productDescription: 'Only' },
      ])));
      apiServiceSpy.getAboRhLov.calls.reset();
      component.onUnitValidated(product, { parsedUnitId: 'NEW-U', codeScheme: 'C' } as any);
      tick();
      expect(apiServiceSpy.getAboRhLov).toHaveBeenCalled();
    }));

    it('should auto-select ABO/Rh when only one option returned', fakeAsync(() => {
      apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([
        { bloodType: 'AB-', aboDescription: 'AB Negative' },
      ])));
      product.modifiedUnitId = 'U1';
      product.modifiedProductCode = 'P1';
      component.onProductCodeChange(product, 'P1');
      tick();
      expect(product.modifiedBloodType).toBe('AB-');
      expect(product.modifiedAboDescription).toBe('AB Negative');
    }));

    it('should clear stale ABO/Rh selection when not in new options', fakeAsync(() => {
      product.modifiedBloodType = 'OLD-TYPE';
      product.modifiedAboDescription = 'Old';
      apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([
        { bloodType: 'A+', aboDescription: 'A Positive' },
      ])));
      product.modifiedUnitId = 'U1';
      component.onProductCodeChange(product, 'P1');
      tick();
      expect(product.modifiedBloodType).toBe('A+');
    }));

    it('should not auto-select ABO/Rh when multiple options returned', fakeAsync(() => {
      apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([
        { bloodType: 'A+', aboDescription: 'A Positive' },
        { bloodType: 'O+', aboDescription: 'O Positive' },
      ])));
      product.modifiedUnitId = 'U1';
      component.onProductCodeChange(product, 'P1');
      tick();
      expect(product.modifiedBloodType).toBe('');
    }));
  });

  describe('Save Request Building', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      apiServiceSpy.getTransferProducts.and.returnValue(of(apiResponse([
        { ...mockProducts[0], unitId: 'U1', productCode: 'P1', aliquot: '01', bloodType: 'O+', expDate: '2026-01-12T13:15:00', collDate: '2026-01-01' },
        { ...mockProducts[0], unitId: 'U2', productCode: 'P2', aliquot: '02', bloodType: 'A+', expDate: '2026-02-14T09:00:00', collDate: '2026-01-02' },
        { ...mockProducts[0], unitId: 'U3', productCode: 'P3', aliquot: '03', bloodType: 'B+', expDate: '2026-03-20T11:00:00', collDate: '2026-01-03' },
      ])));
      component.onRetrieve();
      tick();
    }));

    it('should build correct DTO for Deallocate action', fakeAsync(() => {
      component.products[0].actionTaken = 'D';
      component.onSave();
      tick();
      const request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      expect(request.products[0].qcFlag).toBe('D');
      expect(request.products[0].unitId).toBe('U1');
      expect(request.products[0].productCode).toBe('P1');
      expect(request.products[0].originalUnitId).toBeUndefined();
    }));

    it('should include only products with actions in save request', fakeAsync(() => {
      component.products[0].actionTaken = 'O';
      component.products[2].actionTaken = 'D';
      component.onSave();
      tick();
      const request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      expect(request.products.length).toBe(2);
      expect(request.products[0].qcFlag).toBe('O');
      expect(request.products[1].qcFlag).toBe('D');
    }));

    it('should use original expDate for Modify when modifiedExpDate is empty', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      const p = component.products[0];
      p.modifiedUnitId = 'NEW-U';
      p.modifiedProductCode = 'NEW-P';
      p.modifiedBloodType = 'AB+';
      p.modifiedExpDate = '';
      component.onSave();
      tick();
      const request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      expect(request.products[0].expDate).toBe('2026-01-12T13:15:00');
    }));

    it('should handle mixed Transferred, Modify, and Deallocate in one save', fakeAsync(() => {
      component.products[0].actionTaken = 'O';
      component.onActionChange(component.products[1], 'M');
      tick();
      const p = component.products[1];
      p.modifiedUnitId = 'MOD-U';
      p.modifiedProductCode = 'MOD-P';
      p.modifiedBloodType = 'O-';
      p.modifiedExpDate = '15-FEB-2026';
      component.products[2].actionTaken = 'D';
      component.onSave();
      tick();
      const request = apiServiceSpy.closeTransfer.calls.mostRecent().args[0];
      expect(request.products.length).toBe(3);
      expect(request.products[0].qcFlag).toBe('O');
      expect(request.products[1].qcFlag).toBe('M');
      expect(request.products[1].originalUnitId).toBe('U2');
      expect(request.products[2].qcFlag).toBe('D');
    }));
  });

  describe('Transfer Slip Options', () => {
    beforeEach(() => fixture.detectChanges());

    it('should have all transfer slip options loaded', fakeAsync(() => {
      tick();
      expect(component.transferSlipOptions().length).toBe(2);
    }));

    it('should include expected slip IDs', fakeAsync(() => {
      tick();
      const ids = component.transferSlipOptions().map(s => s.pickSlipId);
      expect(ids).toContain('PTI-00036');
      expect(ids).toContain('PTI-00037');
    }));
  });

  describe('onClearAll', () => {
    it('should reset all component state', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.sortDirection = 'DESC';
      component.products[0].actionTaken = 'O';

      component.onClearAll();

      expect(component.transferSlipCtrl.value).toBe('');
      expect(component.selectedSlipDisplay()).toBe('');
      expect(component.creationDate()).toBe('-');
      expect(component.hasRetrieved).toBeFalse();
      expect(component.products).toEqual([]);
      expect(component.transferType).toBe('');
      expect(component.sortDirection).toBe('ASC');
      expect(component.sourceHospitalName()).toBe('');
      expect(component.sourceHospitalAddress()).toBe('');
      expect(component.destinationHospitalName()).toBe('');
      expect(component.destinationHospitalAddress()).toBe('');
    }));
  });

  describe('Retrieve', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set transferType from selected slip pickSlipType', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00037');
      tick();
      component.onRetrieve();
      tick();
      expect(component.transferType).toBe('XA');
    }));

    it('should pass sortDirection to getTransferProducts', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.sortDirection = 'DESC';
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.getTransferProducts).toHaveBeenCalledWith('PTI-00036', 'DESC');
    }));

    it('should set hasRetrieved after retrieve completes', fakeAsync(() => {
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.hasRetrieved = false;
      component.onRetrieve();
      tick();
      expect(component.hasRetrieved).toBeTrue();
      expect(component.isLoadingProducts).toBeFalse();
    }));

    it('should default transferType to empty when slip not found', fakeAsync(() => {
      component.transferSlipCtrl.setValue('UNKNOWN');
      tick();
      component.onRetrieve();
      tick();
      expect(component.transferType).toBe('');
    }));
  });

  describe('isReadyToSave edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should return true for Modify with original expDate when modifiedExpDate is empty', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      const p = component.products[0];
      p.modifiedUnitId = 'U1';
      p.modifiedProductCode = 'P1';
      p.modifiedBloodType = 'O+';
      p.modifiedExpDate = '';
      expect(component.isReadyToSave()).toBeTrue();
    }));

    it('should return false for Modify missing modifiedBloodType', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      const p = component.products[0];
      p.modifiedUnitId = 'U1';
      p.modifiedProductCode = 'P1';
      p.modifiedBloodType = '';
      p.modifiedExpDate = '01-JAN-2026';
      expect(component.isReadyToSave()).toBeFalse();
    }));

    it('should return false for Modify missing modifiedProductCode', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      const p = component.products[0];
      p.modifiedUnitId = 'U1';
      p.modifiedProductCode = '';
      p.modifiedBloodType = 'O+';
      p.modifiedExpDate = '01-JAN-2026';
      expect(component.isReadyToSave()).toBeFalse();
    }));

    it('should return false for Modify missing modifiedUnitId', fakeAsync(() => {
      component.onActionChange(component.products[0], 'M');
      tick();
      const p = component.products[0];
      p.modifiedUnitId = '';
      p.modifiedProductCode = 'P1';
      p.modifiedBloodType = 'O+';
      p.modifiedExpDate = '01-JAN-2026';
      expect(component.isReadyToSave()).toBeFalse();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject to unsubscribe', fakeAsync(() => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('LOV response.success=false', () => {
    let product: TransferProductRow;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
    }));

    it('should set empty productCodeOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getProductCodeLov.and.returnValue(of({
        success: false, message: 'Error', statusCode: 400, data: [] as any,
      }));
      component.onUnitValidated(product, { parsedUnitId: 'U1', codeScheme: 'C' } as any);
      tick();
      expect(product.productCodeOptions).toEqual([]);
      expect(product.isLoadingProductCodes).toBeFalse();
    }));

    it('should set empty aboRhOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getAboRhLov.and.returnValue(of({
        success: false, message: 'Error', statusCode: 400, data: [] as any,
      }));
      product.modifiedUnitId = 'U1';
      component.onProductCodeChange(product, 'P1');
      tick();
      expect(product.aboRhOptions).toEqual([]);
      expect(product.isLoadingAboRh).toBeFalse();
    }));
  });

  describe('onAboRhChange edge cases', () => {
    it('should set empty description when selected option not found', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.aboRhOptions = [{ bloodType: 'A+', aboDescription: 'A Positive' }];
      component.onAboRhChange(product, 'UNKNOWN');
      expect(product.modifiedBloodType).toBe('UNKNOWN');
      expect(product.modifiedAboDescription).toBe('');
    }));
  });

  describe('loadOpenTransferSlips response.success=false', () => {
    it('should not update transferSlipOptions when response.success is false', fakeAsync(() => {
      apiServiceSpy.getOpenTransferSlips.and.returnValue(of({
        success: false, message: 'Error', statusCode: 400, data: [] as any,
      }));
      fixture.detectChanges();
      tick();
      expect(component.transferSlipOptions().length).toBe(0);
      expect(component.isLoadingSlips).toBeFalse();
    }));
  });

  describe('onUnitValidated sets codeScheme', () => {
    it('should default codeScheme to C when not provided', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
      component.onUnitValidated(product, { parsedUnitId: 'U1', codeScheme: '' } as any);
      tick();
      expect(product.codeScheme).toBe('C');
    }));

    it('should set codeScheme to I when response provides it', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
      component.onUnitValidated(product, { parsedUnitId: 'U1', codeScheme: 'I' } as any);
      tick();
      expect(product.codeScheme).toBe('I');
    }));
  });

  describe('createProductRow', () => {
    it('should initialize all modify fields to defaults', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const p = component.products[0];
      expect(p.actionTaken).toBe('');
      expect(p.modifiedUnitId).toBe('');
      expect(p.modifiedProductCode).toBe('');
      expect(p.modifiedAliquot).toBe('');
      expect(p.modifiedBloodType).toBe('');
      expect(p.modifiedAboDescription).toBe('');
      expect(p.modifiedExpDate).toBe('');
      expect(p.productCodeOptions).toEqual([]);
      expect(p.aliquotOptions).toEqual([]);
      expect(p.aboRhOptions).toEqual([]);
      expect(p.isLoadingProductCodes).toBeFalse();
      expect(p.isLoadingAliquots).toBeFalse();
      expect(p.isLoadingAboRh).toBeFalse();
      expect(p.codeScheme).toBe('C');
      expect(p.expDateError).toBe('');
    }));
  });

  describe('Cancel with Modify fields', () => {
    it('should reset modify fields on cancel for products with Modify action', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
      product.modifiedUnitId = 'MOD-U';
      product.modifiedProductCode = 'MOD-P';
      product.modifiedProductDescription = 'Some Desc';
      product.modifiedBloodType = 'A+';

      component.onCancel();

      expect(product.actionTaken).toBe('');
      expect(product.modifiedUnitId).toBe('');
      expect(product.modifiedProductCode).toBe('');
      expect(product.modifiedProductDescription).toBe('');
      expect(product.modifiedBloodType).toBe('');
    }));

    it('should reset LOV arrays to empty on cancel after they were populated', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.actionTaken = 'M' as any;
      product.productCodeOptions = [{ productCode: 'P1', productDescription: 'Product 1' }];
      product.aliquotOptions = [{ aliquot: '01' }] as any;
      product.aboRhOptions = [{ bloodType: 'O+', aboDescription: 'O Positive' }];
      product.modifiedUnitId = 'U1';
      product.modifiedProductCode = 'P1';
      product.modifiedAliquot = '01';
      product.modifiedBloodType = 'O+';
      product.modifiedAboDescription = 'O Positive';
      product.modifiedExpDate = '01-JAN-2026';

      component.onCancel();

      expect(product.productCodeOptions).toEqual([]);
      expect(product.aliquotOptions).toEqual([]);
      expect(product.aboRhOptions).toEqual([]);
      expect(product.modifiedAliquot).toBe('');
      expect(product.modifiedAboDescription).toBe('');
      expect(product.modifiedExpDate).toBe('');
    }));

    it('should reset LOV arrays when switching from Modify to Transferred', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
      product.productCodeOptions = [{ productCode: 'P1', productDescription: 'Product 1' }];
      product.aliquotOptions = [{ aliquot: '01' }] as any;
      product.aboRhOptions = [{ bloodType: 'A+', aboDescription: 'A Positive' }];

      component.onActionChange(product, 'O');

      expect(product.productCodeOptions).toEqual([]);
      expect(product.aliquotOptions).toEqual([]);
      expect(product.aboRhOptions).toEqual([]);
    }));
  });

  describe('Sort toggle with sort direction parameter', () => {
    it('should toggle from DESC back to ASC and re-retrieve', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      component.sortDirection = 'DESC';
      component.onSortToggle();
      tick();
      expect(component.sortDirection).toBe('ASC');
      expect(apiServiceSpy.getTransferProducts).toHaveBeenCalledWith('PTI-00036', 'ASC');
    }));
  });

  describe('onUnitCleared clears all dependent fields', () => {
    it('should clear aliquot options and abo options', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.modifiedAliquot = 'ALQ';
      product.modifiedAboDescription = 'Desc';
      product.modifiedProductDescription = 'Some Description';
      product.aliquotOptions = [{ aliquot: '01' }] as any;
      product.aboRhOptions = [{ bloodType: 'O+', aboDescription: 'O Positive' }];

      component.onUnitCleared(product);

      expect(product.modifiedAliquot).toBe('');
      expect(product.modifiedAboDescription).toBe('');
      expect(product.modifiedProductDescription).toBe('');
      expect(product.aliquotOptions).toEqual([]);
      expect(product.aboRhOptions).toEqual([]);
      expect(product.modifiedExpDate).toBe('');
      expect(product.modifiedBloodType).toBe('');
    }));
  });

  describe('Expiration Date Validation', () => {
    let product: TransferProductRow;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      product = component.products[0];
      component.onActionChange(product, 'M');
      tick();
    }));

    it('should accept valid DD-MMM-YYYY HH:MM format', () => {
      component.onExpDateInput(product, { target: { value: '15-JAN-2026 13:15' } } as any);
      expect(product.expDateError).toBe('');
    });

    it('should reject plain text input', () => {
      component.onExpDateInput(product, { target: { value: 'some random text' } } as any);
      expect(product.expDateError).toContain('Format must be DD-MMM-YYYY HH:MM');
    });

    it('should reject date without time component', () => {
      component.onExpDateInput(product, { target: { value: '15-JAN-2026' } } as any);
      expect(product.expDateError).toContain('Format must be DD-MMM-YYYY HH:MM');
    });

    it('should reject invalid month abbreviation', () => {
      component.onExpDateInput(product, { target: { value: '15-XYZ-2026 13:15' } } as any);
      expect(product.expDateError).toContain('Format must be DD-MMM-YYYY HH:MM');
    });

    it('should reject invalid calendar date like 31-FEB', () => {
      component.onExpDateInput(product, { target: { value: '31-FEB-2026 10:00' } } as any);
      expect(product.expDateError).toBe('Invalid calendar date.');
    });

    it('should reject hours > 23', () => {
      component.onExpDateInput(product, { target: { value: '15-JAN-2026 25:00' } } as any);
      expect(product.expDateError).toBe('Invalid time. Hours must be 00-23, minutes 00-59.');
    });

    it('should reject minutes > 59', () => {
      component.onExpDateInput(product, { target: { value: '15-JAN-2026 12:61' } } as any);
      expect(product.expDateError).toBe('Invalid time. Hours must be 00-23, minutes 00-59.');
    });

    it('should clear error when input is cleared', () => {
      component.onExpDateInput(product, { target: { value: 'bad' } } as any);
      expect(product.expDateError).toBeTruthy();
      component.onExpDateInput(product, { target: { value: '' } } as any);
      expect(product.expDateError).toBe('');
    });

    it('should accept midnight 00:00', () => {
      component.onExpDateInput(product, { target: { value: '01-JAN-2026 00:00' } } as any);
      expect(product.expDateError).toBe('');
    });

    it('should accept end-of-day 23:59', () => {
      component.onExpDateInput(product, { target: { value: '31-DEC-2026 23:59' } } as any);
      expect(product.expDateError).toBe('');
    });

    it('should be case-insensitive for month', () => {
      component.onExpDateInput(product, { target: { value: '15-jan-2026 13:15' } } as any);
      expect(product.expDateError).toBe('');
    });

    it('should block save when expDate has validation error', fakeAsync(() => {
      product.modifiedUnitId = 'U1';
      product.modifiedProductCode = 'P1';
      product.modifiedBloodType = 'O+';
      component.onExpDateInput(product, { target: { value: 'invalid' } } as any);
      expect(component.isReadyToSave()).toBeFalse();
    }));

    it('should allow save when expDate is valid', fakeAsync(() => {
      product.modifiedUnitId = 'U1';
      product.modifiedProductCode = 'P1';
      product.modifiedBloodType = 'O+';
      component.onExpDateInput(product, { target: { value: '15-JAN-2026 13:15' } } as any);
      expect(component.isReadyToSave()).toBeTrue();
    }));

    it('should clear expDateError on cancel', fakeAsync(() => {
      component.onExpDateInput(product, { target: { value: 'bad' } } as any);
      expect(product.expDateError).toBeTruthy();
      component.onCancel();
      expect(product.expDateError).toBe('');
    }));

    it('should clear expDateError when switching away from Modify', fakeAsync(() => {
      component.onExpDateInput(product, { target: { value: 'bad' } } as any);
      component.onActionChange(product, 'O');
      expect(product.expDateError).toBe('');
    }));

    it('should clear expDateError on onUnitCleared', fakeAsync(() => {
      component.onExpDateInput(product, { target: { value: 'bad' } } as any);
      component.onUnitCleared(product);
      expect(product.expDateError).toBe('');
    }));
  });

  describe('Page Header Effect', () => {
    it('should update headerConfig when pageHeaderData emits', fakeAsync(() => {
      pageHeaderServiceSpy.pageHeaderData.set({
        title: 'Close Hospital Transfer',
        subtitle: 'Custom subtitle',
      });
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.title).toBe('Close Hospital Transfer');
      expect(component.headerConfig.subtitle).toBe('Custom subtitle');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
      expect(component.headerConfig.breadcrumbs[1]).toEqual({ label: 'Close Hospital Transfer', link: null });
    }));

    it('should use default subtitle when pageHeaderData subtitle is empty', fakeAsync(() => {
      pageHeaderServiceSpy.pageHeaderData.set({
        title: 'Close Hospital Transfer',
        subtitle: '',
      });
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.subtitle).toBe('Review information about a particular shipment that has been delivered.');
    }));

    it('should not update headerConfig when pageHeaderData is null', fakeAsync(() => {
      pageHeaderServiceSpy.pageHeaderData.set(null);
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.title).toBe('');
    }));
  });

  describe('productCodeChange clears blood type fields', () => {
    it('should clear modifiedBloodType and modifiedAboDescription before loading new ABO/Rh', fakeAsync(() => {
      fixture.detectChanges();
      component.transferSlipCtrl.setValue('PTI-00036');
      tick();
      component.onRetrieve();
      tick();
      const product = component.products[0];
      product.modifiedBloodType = 'O+';
      product.modifiedAboDescription = 'O Positive';

      apiServiceSpy.getAboRhLov.and.returnValue(of(apiResponse([
        { bloodType: 'A+', aboDescription: 'A Positive' },
        { bloodType: 'B+', aboDescription: 'B Positive' },
      ])));
      component.onProductCodeChange(product, 'NEW-CODE');
      tick();

      expect(product.modifiedBloodType).toBe('');
      expect(product.modifiedAboDescription).toBe('');
    }));
  });
});
