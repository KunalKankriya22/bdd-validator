import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, NEVER } from 'rxjs';

import { ShipDiscardSalvageComponent } from './ship-discard-salvage';
import { ShipDiscardSalvageApiService } from './services/ship-discard-salvage-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { createMockActivatedRoute, createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ShipDiscardSalvageShipment,
  ShipDiscardSalvageBox,
} from './models/ship-discard-salvage.model';

describe('ShipDiscardSalvageComponent', () => {
  let pageHeaderServiceSpy: any;
  let component: ShipDiscardSalvageComponent;
  let fixture: ComponentFixture<ShipDiscardSalvageComponent>;
  let apiServiceSpy: jasmine.SpyObj<ShipDiscardSalvageApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockShipment: ShipDiscardSalvageShipment = {
    shipmentNo: 'DI20260530120000',
    chapterId: '0001',
    consigneeId: 'DISC001',
    consigneeName: 'Discard Processing Center',
    address1: '123 Main St',
    address2: 'Suite 100',
    city: 'Dallas',
    state: 'TX',
    zip: '75235',
    country: 'USA',
    shipmentDate: new Date('2026-05-30T12:00:00Z'),
    shipmentStatus: 'OP',
    carrier: 'UPS',
    carrierDescription: 'UPS Ground',
    trackingNo: '1Z999AA10123456784',
    flightNo: 'AA1234',
    boxCount: 3,
    invoicePrintedDate: null,
    fullAddress: '123 Main St, Suite 100, Dallas, TX, 75235',
  };

  const mockBox: ShipDiscardSalvageBox = {
    boxId: 'BOX0001234',
    boxStatus: 'CL',
    boxType: 'STD',
    boxTypeDescription: 'Standard Box',
    packedByUserId: 'USER01',
    packedByUserName: 'Smith, John',
    packedDate: new Date('2026-05-30T10:30:00Z'),
  };

  const chapterChangedSubject = new Subject<void>();

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ShipDiscardSalvageApiService', [
      'getOpenShipments',
      'getShipmentById',
      'createShipment',
      'addBoxToShipment',
      'getBoxesForConsignee',
      'removeBoxFromShipment',
      'completeShipment',
      'getActiveCarriers',
      'getConsigneesWithBoxes',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Ship Discard and Salvage Products', subtitle: '' }),
    });

    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    apiServiceSpy.getOpenShipments.and.returnValue(of([mockShipment]));
    apiServiceSpy.getShipmentById.and.returnValue(of(mockShipment));
    apiServiceSpy.createShipment.and.returnValue(of(mockShipment));
    apiServiceSpy.addBoxToShipment.and.returnValue(of(mockBox));
    apiServiceSpy.getBoxesForConsignee.and.returnValue(of([mockBox]));
    apiServiceSpy.removeBoxFromShipment.and.returnValue(of({}));
    apiServiceSpy.completeShipment.and.returnValue(of({}));
    apiServiceSpy.getActiveCarriers.and.returnValue(of([]));
    apiServiceSpy.getConsigneesWithBoxes.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [ShipDiscardSalvageComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ShipDiscardSalvageApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    })
    .overrideComponent(ShipDiscardSalvageComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });

      apiServiceSpy.getOpenShipments.and.returnValue(of([mockShipment]));


      apiServiceSpy.getShipmentById.and.returnValue(of(mockShipment));


      apiServiceSpy.createShipment.and.returnValue(of(mockShipment));


      apiServiceSpy.addBoxToShipment.and.returnValue(of(mockBox));


      apiServiceSpy.getBoxesForConsignee.and.returnValue(of([mockBox]));


      apiServiceSpy.removeBoxFromShipment.and.returnValue(of({}));


      apiServiceSpy.completeShipment.and.returnValue(of({}));


      apiServiceSpy.getActiveCarriers.and.returnValue(of([]));


      apiServiceSpy.getConsigneesWithBoxes.and.returnValue(of([]));


    fixture = TestBed.createComponent(ShipDiscardSalvageComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize forms on init', () => {
      fixture.detectChanges();

      expect(component.searchForm).toBeDefined();
      expect(component.shipmentForm).toBeDefined();
      expect(component.boxForm).toBeDefined();
    });

    it('should load open shipments on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getOpenShipments).toHaveBeenCalled();
      expect((component as any).shipments().length).toBe(1);
      expect((component as any).shipments()[0].shipmentNo).toBe('DI20260530120000');
    });

    it('should have correct header config', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });
  });

  describe('Search Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear consignee ID when shipment number is selected', () => {
      // Use a pending observable so onShipmentSelected does not auto-fill consigneeId from the response
      apiServiceSpy.getShipmentById.and.returnValue(NEVER);

      component.searchForm.patchValue({
        consigneeId: 'DISC001',
        shipmentNo: '',
      });

      component.searchForm.patchValue({ shipmentNo: 'DI20260530120000' });
      fixture.detectChanges();

      expect(component.searchForm.get('consigneeId')?.value).toBe('');
    });

    it('should clear shipment number when consignee ID is selected', () => {
      component.searchForm.patchValue({
        shipmentNo: 'DI20260530120000',
        consigneeId: '',
      });

      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      fixture.detectChanges();

      expect(component.searchForm.get('shipmentNo')?.value).toBe('');
    });
  });

  describe('Shipment Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should create shipment when consignee is selected', () => {
      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackingNo: '1Z999AA10123456784',
      });

      component.onCreateShipment();

      expect(apiServiceSpy.createShipment).toHaveBeenCalled();
    });

    it('should not create shipment with invalid form', () => {
      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      component.shipmentForm.patchValue({
        carrier: '',  // Invalid - required
        trackingNo: '',  // Invalid - required
      });

      component.onCreateShipment();

      expect(apiServiceSpy.createShipment).not.toHaveBeenCalled();
    });

    it('should show success message after creating shipment', () => {
      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackingNo: '1Z999AA10123456784',
      });

      component.onCreateShipment();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Shipment created successfully');
    });
  });

  describe('Box Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
    });

    it('should add box to shipment', () => {
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect(apiServiceSpy.addBoxToShipment).toHaveBeenCalledWith(
        'DI20260530120000',
        { boxId: 'BOX0001234' }
      );
    });

    it('should not add box with invalid form', () => {
      component.boxForm.patchValue({ boxId: '' });  // Invalid - required

      component.onAddBox();

      expect(apiServiceSpy.addBoxToShipment).not.toHaveBeenCalled();
    });

    it('should update box count after adding box', () => {
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect((component as any).boxes().length).toBeGreaterThan(0);
    });

    it('should show success message after adding box', () => {
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box added to shipment successfully');
    });
  });

  describe('Cancel Operation', () => {
    it('should clear forms and reset state on cancel', () => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);

      component.onCancel();

      expect((component as any).selectedShipment()).toBeNull();
      expect((component as any).boxes().length).toBe(0);
      expect(component.searchForm.pristine).toBeTrue();
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-05-30T14:30:00Z');
      const formatted = component.formatDateTime(date);

      expect(formatted).toContain('30-');
      expect(formatted).toContain('MAY');
      expect(formatted).toContain('2026');
    });

    it('should handle null date', () => {
      const formatted = component.formatDateTime(null);

      expect(formatted).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading shipments fails', () => {
      apiServiceSpy.getOpenShipments.and.returnValue(throwError(() => new Error('API Error')));

      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should handle error when creating shipment fails', () => {
      fixture.detectChanges();
      apiServiceSpy.createShipment.and.returnValue(throwError(() => ({
        error: {
          errorCode: '4309',
          errorResponse: { error: 'No boxes found for this consignee' }
        }
      })));

      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackingNo: '1Z999AA10123456784',
      });

      component.onCreateShipment();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      fixture.detectChanges();
      const event = { pageSize: 25, pageIndex: 1, previousPageIndex: 0 } as any;

      component.onPageChange(event);

      expect((component as any).tableConfig.pagination?.pageSize).toBe(25);
      expect((component as any).tableConfig.pagination?.pageIndex).toBe(1);
    });
  });

  describe('Computed Values', () => {
    it('should compute hasShipment correctly', () => {
      expect((component as any).hasShipment()).toBeFalse();

      (component as any).selectedShipment.set(mockShipment);

      expect((component as any).hasShipment()).toBeTrue();
    });

    it('should compute hasBoxes correctly', () => {
      expect((component as any).hasBoxes()).toBeFalse();

      (component as any).boxes.set([mockBox]);

      expect((component as any).hasBoxes()).toBeTrue();
    });

    it('should compute canCompleteBoxEntry correctly', () => {
      expect((component as any).canCompleteBoxEntry()).toBeFalse();

      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);

      expect((component as any).canCompleteBoxEntry()).toBeTrue();
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs', () => {
      const fixture2 = TestBed.createComponent(ShipDiscardSalvageComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
    });

    it('should generate element IDs', () => {
      const elementId = (component as any).elementId('shipmentNo');
      expect(elementId).toContain('ship-discard-salvage-');
      expect(elementId).toContain('shipmentNo');
    });
  });

  describe('Lookup Data Loading', () => {
    it('should call getActiveCarriers on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getActiveCarriers).toHaveBeenCalled();
    });

    it('should call getConsigneesWithBoxes on init', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getConsigneesWithBoxes).toHaveBeenCalled();
    });

    it('should populate carriers signal with API response', () => {
      const mockCarriers = [
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS - UPS Ground', isActive: true },
        { carrierCode: 'FDX', carrierName: 'FedEx', description: 'FDX - FedEx', isActive: true },
      ];
      apiServiceSpy.getActiveCarriers.and.returnValue(of(mockCarriers));

      fixture.detectChanges();

      expect((component as any).carriers().length).toBe(2);
      expect((component as any).carriers()[0].carrierCode).toBe('UPS');
      expect((component as any).carriers()[1].carrierCode).toBe('FDX');
    });

    it('should populate consignees signal with API response', () => {
      const mockConsignees = [
        { consigneeId: 'DISC001', consigneeName: 'Discard Center', description: 'DISC001 - Discard Center' },
      ];
      apiServiceSpy.getConsigneesWithBoxes.and.returnValue(of(mockConsignees));

      fixture.detectChanges();

      expect((component as any).consignees().length).toBe(1);
      expect((component as any).consignees()[0].consigneeId).toBe('DISC001');
    });

    it('should show error when getActiveCarriers fails', () => {
      apiServiceSpy.getActiveCarriers.and.returnValue(throwError(() => new Error('Carrier API Error')));

      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should show error when getConsigneesWithBoxes fails', () => {
      apiServiceSpy.getConsigneesWithBoxes.and.returnValue(throwError(() => new Error('Consignee API Error')));

      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should reload open shipments when chapter changes', () => {
      fixture.detectChanges();

      // Reset call counts after initial load
      apiServiceSpy.getOpenShipments.calls.reset();

      chapterChangedSubject.next();

      expect(apiServiceSpy.getOpenShipments).toHaveBeenCalledTimes(1);
    });

    it('should reload lookup data when chapter changes', () => {
      fixture.detectChanges();

      apiServiceSpy.getActiveCarriers.calls.reset();
      apiServiceSpy.getConsigneesWithBoxes.calls.reset();

      chapterChangedSubject.next();

      expect(apiServiceSpy.getActiveCarriers).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getConsigneesWithBoxes).toHaveBeenCalledTimes(1);
    });

    it('should clear existing shipment data when chapter changes', () => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);

      chapterChangedSubject.next();

      expect((component as any).selectedShipment()).toBeNull();
      expect((component as any).boxes().length).toBe(0);
    });
  });

  describe('Searchable Dropdown Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all carriers when search text is empty', () => {
      const mockCarriers = [
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS - UPS Ground', isActive: true },
        { carrierCode: 'FDX', carrierName: 'FedEx', description: 'FDX - FedEx', isActive: true },
      ];
      (component as any).carriers.set(mockCarriers);
      (component as any).carrierSearchText.set('');

      expect(component.filteredCarriers().length).toBe(2);
    });

    it('should filter carriers by carrier code', () => {
      const mockCarriers = [
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS - UPS Ground', isActive: true },
        { carrierCode: 'FDX', carrierName: 'FedEx', description: 'FDX - FedEx', isActive: true },
      ];
      (component as any).carriers.set(mockCarriers);
      (component as any).carrierSearchText.set('ups');

      expect(component.filteredCarriers().length).toBe(1);
      expect(component.filteredCarriers()[0].carrierCode).toBe('UPS');
    });

    it('should filter carriers by carrier name', () => {
      const mockCarriers = [
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS - UPS Ground', isActive: true },
        { carrierCode: 'FDX', carrierName: 'FedEx Express', description: 'FDX - FedEx Express', isActive: true },
      ];
      (component as any).carriers.set(mockCarriers);
      (component as any).carrierSearchText.set('fedex');

      expect(component.filteredCarriers().length).toBe(1);
      expect(component.filteredCarriers()[0].carrierCode).toBe('FDX');
    });

    it('should return all shipments when search text is empty', () => {
      (component as any).shipments.set([mockShipment]);
      (component as any).shipmentSearchText.set('');

      expect(component.filteredShipments().length).toBe(1);
    });

    it('should filter shipments by shipment number', () => {
      const shipment2 = { ...mockShipment, shipmentNo: 'DI20260601120000', consigneeName: 'Salvage Center' };
      (component as any).shipments.set([mockShipment, shipment2]);
      (component as any).shipmentSearchText.set('0530');

      expect(component.filteredShipments().length).toBe(1);
      expect(component.filteredShipments()[0].shipmentNo).toBe('DI20260530120000');
    });

    it('should filter shipments by consignee name', () => {
      const shipment2 = { ...mockShipment, shipmentNo: 'DI20260601120000', consigneeName: 'Salvage Center' };
      (component as any).shipments.set([mockShipment, shipment2]);
      (component as any).shipmentSearchText.set('salvage');

      expect(component.filteredShipments().length).toBe(1);
      expect(component.filteredShipments()[0].consigneeName).toBe('Salvage Center');
    });

    it('should return all consignees when search text is empty', () => {
      const mockConsignees = [
        { consigneeId: 'DISC001', consigneeName: 'Discard Center', description: 'DISC001 - Discard Center' },
        { consigneeId: 'SALV001', consigneeName: 'Salvage Depot', description: 'SALV001 - Salvage Depot' },
      ];
      (component as any).consignees.set(mockConsignees);
      (component as any).consigneeSearchText.set('');

      expect(component.filteredConsignees().length).toBe(2);
    });

    it('should filter consignees by consignee ID', () => {
      const mockConsignees = [
        { consigneeId: 'DISC001', consigneeName: 'Discard Center', description: 'DISC001 - Discard Center' },
        { consigneeId: 'SALV001', consigneeName: 'Salvage Depot', description: 'SALV001 - Salvage Depot' },
      ];
      (component as any).consignees.set(mockConsignees);
      (component as any).consigneeSearchText.set('disc');

      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('DISC001');
    });

    it('should filter consignees by consignee name', () => {
      const mockConsignees = [
        { consigneeId: 'DISC001', consigneeName: 'Discard Center', description: 'DISC001 - Discard Center' },
        { consigneeId: 'SALV001', consigneeName: 'Salvage Depot', description: 'SALV001 - Salvage Depot' },
      ];
      (component as any).consignees.set(mockConsignees);
      (component as any).consigneeSearchText.set('salvage');

      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('SALV001');
    });

    it('should return empty array when no carriers match search', () => {
      const mockCarriers = [
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS - UPS Ground', isActive: true },
      ];
      (component as any).carriers.set(mockCarriers);
      (component as any).carrierSearchText.set('xyz');

      expect(component.filteredCarriers().length).toBe(0);
    });
  });

  describe('DataTable Row Action Handler', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);
    });

    it('should call onRemoveBox when row action is delete', () => {
      // onRemoveBox opens a confirmation dialog, so set up the dialog mock
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(false),
      } as any);

      const event = { action: 'delete', row: mockBox } as any;
      component.onRowAction(event);

      // Verify the confirmation dialog was opened (proves onRemoveBox was called)
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should not call onRemoveBox for non-delete actions', () => {
      spyOn(component, 'onRemoveBox');

      const event = { action: 'edit', row: mockBox } as any;
      component.onRowAction(event);

      expect(component.onRemoveBox).not.toHaveBeenCalled();
    });
  });

  describe('Box Addition - Updates Signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
    });

    it('should call addBoxToShipment API with correct parameters', () => {
      component.boxForm.patchValue({ boxId: 'BOX0009999' });

      component.onAddBox();

      expect(apiServiceSpy.addBoxToShipment).toHaveBeenCalledWith(
        'DI20260530120000',
        { boxId: 'BOX0009999' }
      );
    });

    it('should append the new box to the boxes signal', () => {
      (component as any).boxes.set([]);
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect((component as any).boxes().length).toBe(1);
      expect((component as any).boxes()[0].boxId).toBe('BOX0001234');
    });

    it('should reset box form after successful add', () => {
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect(component.boxForm.get('boxId')?.value).toBeFalsy();
    });

    it('should increment selectedShipment boxCount after adding a box', () => {
      const initialBoxCount = mockShipment.boxCount;
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect((component as any).selectedShipment()?.boxCount).toBe(initialBoxCount + 1);
    });

    it('should not call API when no shipment is selected', () => {
      (component as any).selectedShipment.set(null);
      component.boxForm.patchValue({ boxId: 'BOX0001234' });

      component.onAddBox();

      expect(apiServiceSpy.addBoxToShipment).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Select a Shipment Number or Consignee ID first');
    });

    it('should show error when addBoxToShipment fails', () => {
      apiServiceSpy.addBoxToShipment.and.returnValue(throwError(() => ({
        error: {
          errorCode: '0334',
          errorResponse: { error: 'Box not found in warehouse' }
        }
      })));
      component.boxForm.patchValue({ boxId: 'NOTFOUND' });

      component.onAddBox();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Cancel - State Reset', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset selectedShipment to null', () => {
      (component as any).selectedShipment.set(mockShipment);

      component.onCancel();

      expect((component as any).selectedShipment()).toBeNull();
    });

    it('should clear boxes array', () => {
      (component as any).boxes.set([mockBox, { ...mockBox, boxId: 'BOX0002222' }]);

      component.onCancel();

      expect((component as any).boxes().length).toBe(0);
    });

    it('should clear availableBoxes array', () => {
      (component as any).availableBoxes.set([mockBox]);

      component.onCancel();

      expect((component as any).availableBoxes().length).toBe(0);
    });

    it('should reset search form', () => {
      component.searchForm.patchValue({ shipmentNo: 'DI20260530120000', consigneeId: 'DISC001' });

      component.onCancel();

      expect(component.searchForm.get('shipmentNo')?.value).toBeFalsy();
      expect(component.searchForm.get('consigneeId')?.value).toBeFalsy();
    });

  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Form Getters', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return search form controls via sf', () => {
      expect(component.sf).toBe(component.searchForm.controls);
    });

    it('should return shipment form controls via f', () => {
      expect(component.f).toBe(component.shipmentForm.controls);
    });

    it('should return box form controls via bf', () => {
      expect(component.bf).toBe(component.boxForm.controls);
    });
  });

  describe('onBoxIdInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(mockShipment);
    });

    it('should auto-add box when 14-char barcode is scanned', () => {
      component.boxForm.patchValue({ boxId: '12345678901234' });
      const input = document.createElement('input');
      input.value = '12345678901234';
      const event = { target: input } as unknown as Event;
      component.onBoxIdInput(event);
      expect(apiServiceSpy.addBoxToShipment).toHaveBeenCalled();
    });

    it('should not auto-add box when input is less than 14 chars', () => {
      const input = document.createElement('input');
      input.value = 'BOX001';
      const event = { target: input } as unknown as Event;
      component.onBoxIdInput(event);
      expect(apiServiceSpy.addBoxToShipment).not.toHaveBeenCalled();
    });

    it('should not auto-add box when no shipment selected', () => {
      (component as any).selectedShipment.set(null);
      const input = document.createElement('input');
      input.value = '12345678901234';
      const event = { target: input } as unknown as Event;
      component.onBoxIdInput(event);
      expect(apiServiceSpy.addBoxToShipment).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveBox - confirm path', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set({ ...mockShipment, boxCount: 3 });
      (component as any).boxes.set([mockBox]);
    });

    it('should remove box when confirmed', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onRemoveBox(mockBox);
      expect(apiServiceSpy.removeBoxFromShipment).toHaveBeenCalledWith('DI20260530120000', 'BOX0001234');
      expect((component as any).boxes().length).toBe(0);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box removed successfully');
    });

    it('should not remove box when not confirmed', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.onRemoveBox(mockBox);
      expect(apiServiceSpy.removeBoxFromShipment).not.toHaveBeenCalled();
    });

    it('should not open dialog when no shipment selected', () => {
      (component as any).selectedShipment.set(null);
      component.onRemoveBox(mockBox);
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should handle remove box API error', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      apiServiceSpy.removeBoxFromShipment.and.returnValue(throwError(() => new Error('fail')));
      component.onRemoveBox(mockBox);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should decrement boxCount after removing box', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onRemoveBox(mockBox);
      expect((component as any).selectedShipment()?.boxCount).toBe(2);
    });
  });

  describe('onOpenShipmentCharges', () => {
    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    });

    it('should open shipment charges dialog', () => {
      (component as any).selectedShipment.set(mockShipment);
      component.onOpenShipmentCharges();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should accept explicit shipment param', () => {
      component.onOpenShipmentCharges(mockShipment, true);
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('onViewConsigneesInSameZone', () => {
    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    });

    it('should open dialog when shipment is selected', () => {
      (component as any).selectedShipment.set(mockShipment);
      component.onViewConsigneesInSameZone();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should not open dialog when no shipment', () => {
      (component as any).selectedShipment.set(null);
      component.onViewConsigneesInSameZone();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('onViewShippedBoxes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    });

    it('should open view shipped boxes dialog', () => {
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);
      component.onViewShippedBoxes();
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('onCompleteBoxEntry', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not proceed when no shipment selected', () => {
      (component as any).selectedShipment.set(null);
      component.onCompleteBoxEntry();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show error when no boxes', () => {
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([]);
      component.onCompleteBoxEntry();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot complete shipment with no boxes');
    });

    it('should open print confirmation dialog', () => {
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      component.onCompleteBoxEntry();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should open charges dialog when print confirmed', () => {
      (component as any).selectedShipment.set(mockShipment);
      (component as any).boxes.set([mockBox]);
      let openCallCount = 0;
      dialogSpy.open.and.callFake(() => {
        openCallCount++;
        if (openCallCount === 1) {
          return { afterClosed: () => of({ confirmed: true }) } as any;
        }
        return { afterClosed: () => of(null) } as any;
      });
      component.onCompleteBoxEntry();
      expect(openCallCount).toBe(2);
    });
  });

  describe('displayInfo computed', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return shipment info when shipment selected', () => {
      (component as any).selectedShipment.set(mockShipment);
      const info = (component as any).displayInfo();
      expect(info).toBeTruthy();
      expect(info.shipmentNo).toBe('DI20260530120000');
      expect(info.consigneeId).toBe('DISC001');
    });

    it('should return consignee info when consignee selected but no shipment', () => {
      (component as any).selectedShipment.set(null);
      (component as any).selectedConsigneeInfo.set({
        consigneeId: 'DISC001',
        consigneeName: 'Discard Center',
        address1: '456 Oak St',
        state: 'CA',
        country: 'USA'
      });
      const info = (component as any).displayInfo();
      expect(info).toBeTruthy();
      expect(info.consigneeId).toBe('DISC001');
      expect(info.shipmentNo).toBe('');
    });

    it('should return null when nothing selected', () => {
      (component as any).selectedShipment.set(null);
      (component as any).selectedConsigneeInfo.set(null);
      expect((component as any).displayInfo()).toBeNull();
    });
  });

  describe('isEmpty computed', () => {
    beforeEach(() => fixture.detectChanges());

    it('should be true when no displayInfo and not loading', () => {
      (component as any).selectedShipment.set(null);
      (component as any).selectedConsigneeInfo.set(null);
      (component as any).loading.set(false);
      expect((component as any).isEmpty()).toBe(true);
    });

    it('should be false when loading', () => {
      (component as any).selectedShipment.set(null);
      (component as any).selectedConsigneeInfo.set(null);
      (component as any).loading.set(true);
      expect((component as any).isEmpty()).toBe(false);
    });
  });

  describe('handleError branches', () => {
    beforeEach(() => fixture.detectChanges());

    it('should use error.error.message when available', () => {
      apiServiceSpy.getOpenShipments.and.returnValue(throwError(() => ({
        error: { message: 'Custom error message' }
      })));
      (component as any).loadOpenShipments();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom error message');
    });

    it('should use error.message as fallback', () => {
      apiServiceSpy.getOpenShipments.and.returnValue(throwError(() => ({
        message: 'Simple error'
      })));
      (component as any).loadOpenShipments();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Simple error');
    });

    it('should use error.error.errorResponse.error when available', () => {
      apiServiceSpy.getOpenShipments.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'API response error' } }
      })));
      (component as any).loadOpenShipments();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('API response error');
    });
  });

  describe('onCreateShipment - no consignee', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when no consignee selected', () => {
      component.searchForm.patchValue({ consigneeId: '' });
      component.shipmentForm.patchValue({ carrier: 'UPS', trackingNo: 'TRACK123' });
      component.onCreateShipment();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a consignee');
    });
  });

  describe('createShipmentThenAddBox', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedShipment.set(null);
    });

    it('should show error when carrier/tracking not set', () => {
      const consignee = { consigneeId: 'DISC001', consigneeName: 'Test' };
      (component as any).selectedConsigneeInfo.set(consignee);
      component.shipmentForm.patchValue({ carrier: '', trackingNo: '' });
      component.boxForm.patchValue({ boxId: 'BOX0001234' });
      component.onAddBox();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Carrier and Track No are required before adding a box');
    });

    it('should create shipment then add box when carrier/tracking are set', () => {
      const consignee = { consigneeId: 'DISC001', consigneeName: 'Test' };
      (component as any).selectedConsigneeInfo.set(consignee);
      component.searchForm.patchValue({ consigneeId: 'DISC001' }, { emitEvent: false });
      component.shipmentForm.patchValue({ carrier: 'UPS', trackingNo: 'TRACK123' });
      component.boxForm.patchValue({ boxId: 'BOX0001234' });
      component.onAddBox();
      expect(apiServiceSpy.createShipment).toHaveBeenCalled();
      expect(apiServiceSpy.addBoxToShipment).toHaveBeenCalled();
    });

    it('should handle create shipment error in createShipmentThenAddBox', () => {
      const consignee = { consigneeId: 'DISC001', consigneeName: 'Test' };
      (component as any).selectedConsigneeInfo.set(consignee);
      component.searchForm.patchValue({ consigneeId: 'DISC001' }, { emitEvent: false });
      component.shipmentForm.patchValue({ carrier: 'UPS', trackingNo: 'TRACK123' });
      component.boxForm.patchValue({ boxId: 'BOX0001234' });
      apiServiceSpy.createShipment.and.returnValue(throwError(() => new Error('fail')));
      component.onAddBox();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('Carrier auto-fill', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).carriers.set([
        { carrierCode: 'UPS', carrierName: 'UPS Ground', description: 'UPS', isActive: true }
      ]);
    });

    it('should auto-fill carrier name when carrier is selected', () => {
      component.shipmentForm.patchValue({ carrier: 'UPS' });
      expect(component.shipmentForm.get('carrierName')?.value).toBe('UPS Ground');
    });
  });

  describe('Search control subscriptions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update shipmentSearchText on shipmentSearchCtrl change', () => {
      component.shipmentSearchCtrl.setValue('DI2026');
      expect((component as any).shipmentSearchText()).toBe('DI2026');
    });

    it('should update consigneeSearchText on consigneeSearchCtrl change', () => {
      component.consigneeSearchCtrl.setValue('DISC');
      expect((component as any).consigneeSearchText()).toBe('DISC');
    });

    it('should update carrierSearchText on carrierSearchCtrl change', () => {
      component.carrierSearchCtrl.setValue('UPS');
      expect((component as any).carrierSearchText()).toBe('UPS');
    });
  });

  describe('onShipmentSelected - shipment not found', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when shipment is null', () => {
      apiServiceSpy.getShipmentById.and.returnValue(of(null as any));
      component.searchForm.patchValue({ shipmentNo: 'NOTFOUND' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Shipment not found');
    });

    it('should handle getShipmentById error', () => {
      apiServiceSpy.getShipmentById.and.returnValue(throwError(() => new Error('fail')));
      component.searchForm.patchValue({ shipmentNo: 'ERROR_SHIPMENT' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('onConsigneeSelected', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set selectedConsigneeInfo when consignee found in list', () => {
      (component as any).consignees.set([
        { consigneeId: 'DISC001', consigneeName: 'Discard Center', address1: '123 Main', state: 'TX', country: 'USA' }
      ]);
      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      expect((component as any).selectedConsigneeInfo()?.consigneeId).toBe('DISC001');
      expect((component as any).hasConsigneeSelected()).toBe(true);
    });
  });

  describe('loadAvailableBoxesForConsignee error', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle error when loading boxes for consignee fails', () => {
      apiServiceSpy.getBoxesForConsignee.and.returnValue(throwError(() => new Error('fail')));
      (component as any).consignees.set([
        { consigneeId: 'DISC001', consigneeName: 'Test' }
      ]);
      component.searchForm.patchValue({ consigneeId: 'DISC001' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });
});
