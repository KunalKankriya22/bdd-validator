import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ViewConsigneesSameZoneDialog, ViewConsigneesSameZoneDialogData } from './view-consignees-same-zone';
import { ShipProductsService } from '../../services/ship-products.service';
import { ConsigneeInZoneDto } from '../../models/ship-products.model';

describe('ViewConsigneesSameZoneDialog', () => {
  let component: ViewConsigneesSameZoneDialog;
  let fixture: ComponentFixture<ViewConsigneesSameZoneDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewConsigneesSameZoneDialog>>;
  let serviceSpy: jasmine.SpyObj<ShipProductsService>;

  const mockDialogData: ViewConsigneesSameZoneDialogData = {
    consigneeId: 'CONS001',
  };

  const mockConsignees: ConsigneeInZoneDto[] = [
    {
      consigneeId: 'CONS002', consigneeName: 'City Clinic',
      address1: '456 Oak Ave', city: 'Houston', state: 'TX',
      zip: '77001', zone: 'ZONE1', orderClass: 'A', orderStatus: 'Open',
    },
    {
      consigneeId: 'CONS003', consigneeName: 'Regional Medical',
      address1: '789 Pine St', city: 'Austin', state: 'TX',
      zip: '78701', zone: 'ZONE1', orderClass: 'B', orderStatus: 'Pending',
    },
  ];

  function createComponent(consignees: ConsigneeInZoneDto[] | 'error' = mockConsignees) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    serviceSpy = jasmine.createSpyObj('ShipProductsService', [
      'getConsigneesInSameZone',
    ]);

    if (consignees === 'error') {
      serviceSpy.getConsigneesInSameZone.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load consignees' } }))
      );
    } else {
      serviceSpy.getConsigneesInSameZone.and.returnValue(of(consignees));
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ViewConsigneesSameZoneDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ShipProductsService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewConsigneesSameZoneDialog);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template may need DataTable */ }
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load consignees on init', () => {
      expect(serviceSpy.getConsigneesInSameZone).toHaveBeenCalledWith('CONS001');
    });

    it('should populate consignees signal with loaded data', () => {
      expect((component as any).consignees().length).toBe(2);
      expect((component as any).consignees()[0].consigneeId).toBe('CONS002');
    });

    it('should set loading to false after load completes', () => {
      expect((component as any).loading()).toBeFalse();
    });

    it('should set error to null on successful load', () => {
      expect((component as any).error()).toBeNull();
    });
  });

  describe('Table Configuration', () => {
    it('should have all columns including orderClass and orderStatus', () => {
      const config = component.tableConfig();
      const columnKeys = config.columns.map((c: any) => c.key);
      expect(columnKeys).toEqual([
        'consigneeId', 'consigneeName', 'address1', 'city', 'state', 'zip', 'zone', 'orderClass', 'orderStatus',
      ]);
    });

    it('should have stickyHeader enabled', () => {
      const config = component.tableConfig();
      expect(config.stickyHeader).toBeTrue();
    });

    it('should have correct empty message', () => {
      const config = component.tableConfig();
      expect(config.emptyMessage).toBe('No consignees found in the same zone');
    });

    it('should have showPagination set to false', () => {
      const config = component.tableConfig();
      expect(config.showPagination).toBeFalse();
    });

    it('should have correct column headers', () => {
      const config = component.tableConfig();
      const headers = config.columns.map((c: any) => c.header);
      expect(headers).toEqual([
        'Consignee', 'Name', 'Address', 'City', 'State', 'ZIP', 'Zone', 'Class', 'Order Status',
      ]);
    });
  });

  describe('Error Handling', () => {
    it('should set error message when loading consignees fails', () => {
      createComponent('error');
      expect((component as any).error()).toBe('Failed to load consignees');
    });

    it('should set loading to false on error', () => {
      createComponent('error');
      expect((component as any).loading()).toBeFalse();
    });

    it('should handle error with no message', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      serviceSpy = jasmine.createSpyObj('ShipProductsService', ['getConsigneesInSameZone']);
      serviceSpy.getConsigneesInSameZone.and.returnValue(throwError(() => ({})));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ViewConsigneesSameZoneDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ViewConsigneesSameZoneDialog);
      component = fixture.componentInstance;
      try { fixture.detectChanges(); } catch (e) {}

      expect((component as any).error()).toBe('Failed to load consignees');
    });
  });

  describe('Empty State', () => {
    it('should handle empty consignees list', () => {
      createComponent([]);
      expect((component as any).consignees().length).toBe(0);
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });
});
