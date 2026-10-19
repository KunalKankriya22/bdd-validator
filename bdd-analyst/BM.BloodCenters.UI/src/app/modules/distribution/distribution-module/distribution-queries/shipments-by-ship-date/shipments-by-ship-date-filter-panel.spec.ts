import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import moment from 'moment';

import { ShipmentsByShipDateFilterPanel } from './shipments-by-ship-date-filter-panel';
import { ShipmentsByShipDateService } from './services/shipments-by-ship-date.service';

describe('ShipmentsByShipDateFilterPanel', () => {
  let component: ShipmentsByShipDateFilterPanel;
  let fixture: ComponentFixture<ShipmentsByShipDateFilterPanel>;
  let mockService: jasmine.SpyObj<ShipmentsByShipDateService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ShipmentsByShipDateService', [
      'getFilterOptions'
    ]);
    mockService.getFilterOptions.and.returnValue(of({
      statuses: [
        { code: 'OPEN', description: 'Open' },
        { code: 'CLOSED', description: 'Closed' }
      ],
      types: [
        { code: 'STANDARD', description: 'Standard' },
        { code: 'EMERGENCY', description: 'Emergency' }
      ]
    }));

    TestBed.configureTestingModule({
      imports: [ShipmentsByShipDateFilterPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: ShipmentsByShipDateService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(ShipmentsByShipDateFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value).toEqual({
      status: null,
      shipmentType: null,
      dateReceived: null
    });
  });

  it('should load filter options on init', () => {
    expect(mockService.getFilterOptions).toHaveBeenCalled();
    expect(component.statusOptions().length).toBe(2);
    expect(component.typeOptions().length).toBe(2);
  });

  describe('onApply', () => {
    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        status: 'OPEN',
        shipmentType: 'STANDARD',
        dateReceived: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        status: 'OPEN',
        shipmentType: 'STANDARD',
        dateReceived: null
      });
    });

    it('should format moment date to YYYY-MM-DD string', () => {
      spyOn(component.apply, 'emit');

      const testMoment = moment('2025-06-15');
      component.filterForm.patchValue({
        status: null,
        shipmentType: null,
        dateReceived: testMoment
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          dateReceived: '2025-06-15'
        })
      );
    });

    it('should emit null for empty string values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        status: '',
        shipmentType: '',
        dateReceived: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        status: null,
        shipmentType: null,
        dateReceived: null
      });
    });
  });

  describe('onClear', () => {
    it('should reset the form', () => {
      spyOn(component.clear, 'emit');

      component.filterForm.patchValue({
        status: 'OPEN',
        shipmentType: 'STANDARD'
      });

      component.onClear();

      expect(component.filterForm.value.status).toBeNull();
      expect(component.filterForm.value.shipmentType).toBeNull();
      expect(component.filterForm.value.dateReceived).toBeNull();
      expect(component.clear.emit).toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('currentFilters input', () => {
    it('should populate form from currentFilters on init', () => {
      component.currentFilters = {
        status: 'CLOSED',
        shipmentType: 'EMERGENCY',
        dateReceived: '2025-06-15'
      };

      component.ngOnInit();

      expect(component.filterForm.value.status).toBe('CLOSED');
      expect(component.filterForm.value.shipmentType).toBe('EMERGENCY');
      expect(component.filterForm.value.dateReceived).toBeTruthy();
    });

    it('should handle null currentFilters', () => {
      component.currentFilters = {
        status: null,
        shipmentType: null,
        dateReceived: null
      };

      component.ngOnInit();

      expect(component.filterForm.value.status).toBeNull();
      expect(component.filterForm.value.shipmentType).toBeNull();
    });
  });
});
