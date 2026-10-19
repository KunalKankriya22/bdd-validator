import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { ProductHistoryDialog } from './product-history-dialog';
import { UnitProductHistoryService } from '../services/unit-product-history.service';
import { ProductHistoryDialogData, ProductHistoryDto } from '../models/unit-product-history.model';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: '<div></div>',
})
class MockDataTableComponent {
  @Input() config: any;
  @Input() data: any;
  @Input() loading: any;
  @Output() rowAction = new EventEmitter<any>();
}

describe('ProductHistoryDialog', () => {
  let component: ProductHistoryDialog;
  let fixture: ComponentFixture<ProductHistoryDialog>;
  let historyServiceSpy: jasmine.SpyObj<UnitProductHistoryService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;

  const mockDialogData: ProductHistoryDialogData = {
    unitId: '12345678901',
    productCode: 'PRB',
    aliquot: '00',
    collectionDate: '2024-01-15',
    product: 'PRB00',
    shipmentNumber: 'ORD-2024-001',
  };

  const mockHistoryRecords: ProductHistoryDto[] = [
    {
      statusDescription: 'Component Production - Create Product',
      statusInd: 'AV',
      fromDate: '2024-01-15T10:30:00',
      personName: 'John Smith',
      destination: 'LAB-01',
      inventoryClass: 'AV',
      customerName: null,
      consigneeName: null,
    },
    {
      statusDescription: 'Inventory - Allocate Product',
      statusInd: 'AL',
      fromDate: '2024-01-16T14:20:00',
      personName: 'Jane Doe',
      destination: 'ORD-2024-001',
      inventoryClass: 'AL',
      customerName: null,
      consigneeName: null,
    },
    {
      statusDescription: 'Distribution - Ship Product',
      statusInd: 'SH',
      fromDate: '2024-01-16T16:00:00',
      personName: 'Bob Wilson',
      destination: 'HOSP-A',
      inventoryClass: 'SH',
      customerName: 'HOSP-A',
      consigneeName: 'HOSP-A',
    },
  ];

  beforeEach(() => {

    historyServiceSpy = jasmine.createSpyObj('UnitProductHistoryService', ['getProductHistory']);
    historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));

    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['convertGmtToLocal', 'convertLocalToGmt']);
    chapterTimezoneServiceSpy.convertGmtToLocal.and.callFake((m: any) => m.clone());



      TestBed.configureTestingModule({
      imports: [MatDialogModule, NoopAnimationsModule],
      providers: [
        { provide: UnitProductHistoryService, useValue: historyServiceSpy },
        { provide: MAT_DIALOG_DATA, useValue: { ...mockDialogData } },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    })
      .overrideComponent(ProductHistoryDialog, {
        set: {
          imports: [
            CommonModule,
            MatDialogModule,
            MatButtonModule,
            MatIconModule,
            MatProgressSpinnerModule,
            MatChipsModule,
            MockDataTableComponent,
          ],
        },
      });


    


      historyServiceSpy.getProductHistory.calls.reset();


      chapterTimezoneServiceSpy.convertGmtToLocal.calls.reset();


      historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));


    fixture = TestBed.createComponent(ProductHistoryDialog);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should load history from API on init when no pre-fetched records', () => {
      fixture.detectChanges();

      expect(historyServiceSpy.getProductHistory).toHaveBeenCalledWith(
        mockDialogData.unitId,
        mockDialogData.productCode,
        mockDialogData.aliquot,
        mockDialogData.collectionDate
      );
    });

    it('should use pre-fetched records when provided and skip API call', () => {
      component.data.historyRecords = mockHistoryRecords;
      historyServiceSpy.getProductHistory.calls.reset();

      fixture.detectChanges();

      expect(historyServiceSpy.getProductHistory).not.toHaveBeenCalled();
      expect(component.historyRecords().length).toBe(3);
    });





    it('should set dialog data', () => {
      expect(component.data.unitId).toBe(mockDialogData.unitId);
      expect(component.data.productCode).toBe(mockDialogData.productCode);
    });
  });

  describe('Loading History', () => {


    it('should map history records to table rows', () => {
      fixture.detectChanges();

      const records = component.historyRecords();
      expect(records.length).toBe(3);
      expect(records[0].formattedDate).toContain('15-JAN-2024');
      expect(records[0].statusBadgeClass).toBe('status-available');
    });





    it('should set hasHistory to true when records exist', () => {
      fixture.detectChanges();

      expect(component.hasHistory()).toBeTrue();
    });

    it('should set loading to true during API call', () => {
      const historySubject = new Subject<ProductHistoryDto[]>();
      historyServiceSpy.getProductHistory.and.returnValue(historySubject.asObservable());
      component.data.historyRecords = undefined;
      historyServiceSpy.getProductHistory.calls.reset();

      component.loadHistory();

      expect(component.loading()).toBeTrue();

      historySubject.next(mockHistoryRecords);
      historySubject.complete();

      expect(component.loading()).toBeFalse();
    });

    it('should map customerName to customer and consigneeName to consignee in table rows', () => {
      fixture.detectChanges();
      const records = component.historyRecords();
      const shippedRecord = records.find(r => r.statusInd === 'SH');
      expect(shippedRecord?.customer).toBe('HOSP-A');
      expect(shippedRecord?.consignee).toBe('HOSP-A');
    });

    it('should map null customerName and consigneeName to empty strings', () => {
      fixture.detectChanges();
      const records = component.historyRecords();
      const availableRecord = records.find(r => r.statusInd === 'AV');
      expect(availableRecord?.customer).toBe('');
      expect(availableRecord?.consignee).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', () => {
      const errorMessage = 'Product has no history';
      historyServiceSpy.getProductHistory.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      fixture.detectChanges();

      expect(component.error()).toBe(errorMessage);
      expect(component.loading()).toBeFalse();

      fixture.detectChanges();
      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.textContent).toContain(errorMessage);
    });

    it('should set error if required data is missing', () => {
      component.data.unitId = '';
      component.loadHistory();

      expect(component.error()).toBe('Required product information is missing');
    });

    it('should allow retry after error', () => {
      historyServiceSpy.getProductHistory.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      expect(component.error()).toBeTruthy();

      // Restore unitId and reset to success
      component.data.unitId = mockDialogData.unitId;
      historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));

      component.onRetry();

      expect(component.error()).toBeNull();
      expect(component.hasHistory()).toBeTrue();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no history records', () => {
      historyServiceSpy.getProductHistory.and.returnValue(of([]));

      fixture.detectChanges();

      expect(component.hasHistory()).toBeFalse();

      fixture.detectChanges();
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  describe('Computed Values', () => {
    it('should compute displayProduct from data', () => {
      expect(component.displayProduct()).toBe('PRB00');
    });

    it('should compute displayShipmentNumber from data', () => {
      expect(component.displayShipmentNumber()).toBe('ORD-2024-001');
    });

    it('should show N/A for missing shipment number', () => {
      component.data.shipmentNumber = undefined;
      expect(component.displayShipmentNumber()).toBe('N/A');
    });
  });

  describe('Table Configuration', () => {


    it('should disable pagination', () => {
      expect(component.tableConfig.showPagination).toBeFalse();
    });


  });

  describe('Status Badge Classes', () => {
    it('should return correct class for Available status', () => {
      const badgeClass = component['getStatusBadgeClass']('AV');
      expect(badgeClass).toBe('status-available');
    });

    it('should return correct class for Delivered status', () => {
      const badgeClass = component['getStatusBadgeClass']('DL');
      expect(badgeClass).toBe('status-delivered');
    });

    it('should return correct class for Shipped status', () => {
      const badgeClass = component['getStatusBadgeClass']('SH');
      expect(badgeClass).toBe('status-shipped');
    });

    it('should return default class for unknown status', () => {
      const badgeClass = component['getStatusBadgeClass']('UNKNOWN');
      expect(badgeClass).toBe('status-default');
    });

    it('should return status-allocated for WO (Work Order) status', () => {
      expect(component['getStatusBadgeClass']('WO')).toBe('status-allocated');
    });

    it('should return status-in-lab for CM status', () => {
      expect(component['getStatusBadgeClass']('CM')).toBe('status-in-lab');
    });
  });

  describe('Date Formatting', () => {
    it('should format date to DD-MMM-YYYY HH:mm format', () => {
      const formatted = component['formatDateTime']('2024-01-15T10:30:00');
      expect(formatted).toBe('15-JAN-2024 10:30');
    });

    it('should handle invalid date strings', () => {
      const invalidDate = 'invalid-date';
      const formatted = component['formatDateTime'](invalidDate);
      expect(formatted).toBe(invalidDate);
    });
  });

  describe('Timezone Conversion', () => {
    it('should use ChapterTimezoneService for date formatting', () => {
      fixture.detectChanges();
      // Component should call convertGmtToLocal when mapping records
      expect(chapterTimezoneServiceSpy.convertGmtToLocal).toHaveBeenCalled();
    });
  });

  describe('Aliquot Display', () => {
    it('should display productCode separately from aliquot', () => {
      fixture.detectChanges();
      const infoLabels = fixture.nativeElement.querySelectorAll('.info-label');
      const labelTexts = Array.from(infoLabels).map((el: any) => el.textContent.trim());
      expect(labelTexts).toContain('Product Code');
      expect(labelTexts).toContain('Aliquot');
    });

    it('should display correct product code value', () => {
      fixture.detectChanges();
      const infoValues = fixture.nativeElement.querySelectorAll('.info-value');
      const values = Array.from(infoValues).map((el: any) => el.textContent.trim());
      expect(values).toContain(mockDialogData.productCode);
    });

    it('should display correct aliquot value', () => {
      fixture.detectChanges();
      const infoValues = fixture.nativeElement.querySelectorAll('.info-value');
      const values = Array.from(infoValues).map((el: any) => el.textContent.trim());
      expect(values).toContain(mockDialogData.aliquot);
    });
  });

  describe('Status Display Names', () => {
    it('should map all known status codes to display names', () => {
      const knownStatuses = ['AV', 'AL', 'PK', 'SH', 'DL', 'RT', 'QU', 'DI', 'OD', 'IL', 'CK', 'XR', 'RP', 'CM', 'WO'];
      knownStatuses.forEach(code => {
        const name = component['getStatusDisplayName'](code);
        expect(name).not.toBe(code);
      });
    });

    it('should return raw code for unknown status', () => {
      const name = component['getStatusDisplayName']('ZZ');
      expect(name).toBe('ZZ');
    });

    it('should return Work Order for WO status code', () => {
      expect(component['getStatusDisplayName']('WO')).toBe('Work Order');
    });

    it('should return In Lab for CM status code', () => {
      expect(component['getStatusDisplayName']('CM')).toBe('In Lab');
    });
  });

  describe('Retry', () => {
    it('should reload history on retry', () => {
      // First set error state
      component.error.set('Some error');
      component.loading.set(false);

      // Setup service for retry
      historyServiceSpy.getProductHistory.and.returnValue(of(mockHistoryRecords));

      component.onRetry();

      expect(component.error()).toBeNull();
      expect(component.hasHistory()).toBeTrue();
    });
  });

  describe('Template Rendering', () => {
    it('should display unit ID in header', () => {
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('.product-info-header');
      expect(header.textContent).toContain(mockDialogData.unitId);
    });

    it('should display shipment number in header', () => {
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('.product-info-header');
      expect(header.textContent).toContain(mockDialogData.shipmentNumber || 'N/A');
    });

    it('should render close button', () => {
      fixture.detectChanges();
      const closeBtn = fixture.nativeElement.querySelector('[aria-label="Close dialog"]');
      expect(closeBtn).toBeTruthy();
    });

    it('should show loading spinner when loading is true', () => {
      fixture.detectChanges();
      component.loading.set(true);
      fixture.detectChanges();
      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeTruthy();
      expect(loadingContainer.textContent).toContain('Loading product history');
    });

    it('should hide loading spinner when loading is false', () => {
      fixture.detectChanges();
      component.loading.set(false);
      fixture.detectChanges();
      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeFalsy();
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
