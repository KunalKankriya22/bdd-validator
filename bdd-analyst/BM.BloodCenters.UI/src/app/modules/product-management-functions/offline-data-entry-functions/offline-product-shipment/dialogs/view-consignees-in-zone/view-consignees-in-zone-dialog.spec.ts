import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ViewConsigneesInZoneDialog, ViewConsigneesInZoneDialogData } from './view-consignees-in-zone-dialog';
import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { ConsigneeInZoneDto } from '../../models/offline-product-shipment.model';

describe('ViewConsigneesInZoneDialog', () => {
  let component: ViewConsigneesInZoneDialog;
  let fixture: ComponentFixture<ViewConsigneesInZoneDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ViewConsigneesInZoneDialog>>;
  let apiServiceSpy: jasmine.SpyObj<OfflineProductShipmentApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ViewConsigneesInZoneDialogData = {
    consigneeId: 'CONS001',
    zone: 'ZONE-A'
  };

  const mockConsignees: ConsigneeInZoneDto[] = [
    { consigneeId: 'CONS002', name: 'Hospital B', orderClass: 'Standing', orderStatus: 'Active', orderStatusDesc: 'Active' },
    { consigneeId: 'CONS003', name: 'Clinic C', orderClass: 'Special', orderStatus: 'Pending', orderStatusDesc: 'Pending' }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('OfflineProductShipmentApiService', ['getConsigneesInSameZone']);
    apiServiceSpy.getConsigneesInSameZone.and.returnValue(of(mockConsignees));
    snackbarServiceSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [ViewConsigneesInZoneDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: OfflineProductShipmentApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewConsigneesInZoneDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have a unique componentId', () => {
    fixture.detectChanges();
    expect(component['componentId']).toContain('view-consignees-in-zone-dialog-');
  });

  it('should set consigneeId from injected data', () => {
    fixture.detectChanges();
    expect(component['consigneeId']).toBe('CONS001');
  });

  it('should call getConsigneesInSameZone on init', () => {
    fixture.detectChanges();
    expect(apiServiceSpy.getConsigneesInSameZone).toHaveBeenCalledWith('CONS001', 'ZONE-A');
  });

  it('should populate consignees signal on successful load', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component['consignees']()).toEqual(mockConsignees);
    expect(component['loading']()).toBeFalse();
  }));

  it('should set error signal on API failure', fakeAsync(() => {
    apiServiceSpy.getConsigneesInSameZone.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(component['error']()).toBe('Failed to load consignees');
    expect(component['loading']()).toBeFalse();
  }));

  it('should close dialog on onClose', () => {
    fixture.detectChanges();
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should initialize table config with 4 columns', () => {
    fixture.detectChanges();
    expect(component['tableConfig']).toBeTruthy();
    expect(component['tableConfig'].columns.length).toBe(4);
    expect(component['tableConfig'].columns.map(c => c.key)).toEqual(['consigneeId', 'name', 'orderClass', 'orderStatus']);
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('isEmpty should return true when consignees is empty', () => {
      component['consignees'].set([]);
      expect(component['isEmpty']()).toBeTrue();
    });

    it('isEmpty should return false when consignees has data', () => {
      component['consignees'].set(mockConsignees);
      expect(component['isEmpty']()).toBeFalse();
    });

    it('isReady should be true when not loading and no error', () => {
      component['loading'].set(false);
      component['error'].set(null);
      expect(component['isReady']()).toBeTrue();
    });

    it('isReady should be false when loading', () => {
      component['loading'].set(true);
      expect(component['isReady']()).toBeFalse();
    });

    it('isReady should be false when error exists', () => {
      component['error'].set('Some error');
      expect(component['isReady']()).toBeFalse();
    });
  });

  it('should generate unique element IDs', () => {
    fixture.detectChanges();
    const id = component['elementId']('title');
    expect(id).toContain('view-consignees-in-zone-dialog-');
    expect(id).toContain('-title');
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    fixture.detectChanges();
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
