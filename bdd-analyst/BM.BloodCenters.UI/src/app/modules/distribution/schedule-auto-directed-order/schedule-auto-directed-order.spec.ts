import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject, throwError } from 'rxjs';

import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';

import { ScheduleAutoDirectedOrderComponent } from './schedule-auto-directed-order';
import { ScheduleAutoDirectedOrderService } from './services/schedule-auto-directed-order.service';
import { AvailableUnit, CustomerLookup, ConsigneeLookup, ReturnResult, SelectedUnit } from './models/schedule-auto-directed-order.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ScheduleAutoDirectedOrderComponent', () => {
  let component: ScheduleAutoDirectedOrderComponent;
  let fixture: ComponentFixture<ScheduleAutoDirectedOrderComponent>;
  let mockService: jasmine.SpyObj<ScheduleAutoDirectedOrderService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<void>;

  const mockCustomers: CustomerLookup[] = [
    { customerId: 'DAL-RG0001', name: 'Parkland Hospital' },
    { customerId: 'OTHER001', name: 'Other Hospital' },
  ];

  const mockConsigneesLookup: ConsigneeLookup[] = [
    { consigneeId: 'PAR-CS0001', name: 'Parkland Consignee' },
  ];

  const mockUnits: AvailableUnit[] = [
    {
      unitId: 'W633317070115-H',
      checkDigit: null,
      aliquot: null,
      productCode: 'E2807100',
      productCodeDesc: 'PLT CPD',
      bloodType: 'B',
      codeDesc: 'B - Auto',
      expirationDate: '2025-03-01T09:00:00Z',
      patientName: 'Mansonn Quinton',
      productType: 'PLT',
      collectionDate: null,
      chapterId: 'TEST',
      pickSlipId: null,
    },
    {
      unitId: 'W633317070116-H',
      checkDigit: null,
      aliquot: null,
      productCode: 'E2807101',
      productCodeDesc: 'PLT CPD',
      bloodType: 'A',
      codeDesc: 'A +',
      expirationDate: '2025-03-02T09:00:00Z',
      patientName: 'Elena Foster',
      productType: 'PLT',
      collectionDate: null,
      chapterId: 'TEST',
      pickSlipId: null,
    },
    {
      unitId: 'W633317070117-H',
      checkDigit: null,
      aliquot: null,
      productCode: 'E2807102',
      productCodeDesc: 'PLT QTR',
      bloodType: 'O',
      codeDesc: 'O +',
      expirationDate: '2025-03-03T09:00:00Z',
      patientName: 'Ravi Patel',
      productType: 'PLT',
      collectionDate: null,
      chapterId: 'TEST',
      pickSlipId: null,
    },
  ];

  const successUnitsResponse: ReturnResult<AvailableUnit> = {
    success: true,
    statusCode: 200,
    message: 'Available units retrieved successfully',
    data: mockUnits,
    total: 3,
  };

  const emptyUnitsResponse: ReturnResult<AvailableUnit> = {
    success: true,
    statusCode: 200,
    message: 'No available units found',
    data: [],
    total: 0,
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ScheduleAutoDirectedOrderService', [
      'getAvailableUnits',
      'createOrder',
      'getCustomersLookup',
      'getConsigneesLookup',
    ]);
    mockSnackbarService = createMockSnackbarService();
    chapterChangedSubject = new Subject<void>();

    mockService.getCustomersLookup.and.returnValue(
      of({ success: true, statusCode: 200, message: 'OK', data: mockCustomers, total: 2 })
    );
    mockService.getConsigneesLookup.and.returnValue(
      of({ success: true, statusCode: 200, message: 'OK', data: mockConsigneesLookup, total: 1 })
    );



      TestBed.configureTestingModule({
      imports: [
        ScheduleAutoDirectedOrderComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ScheduleAutoDirectedOrderService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        {
          provide: HeaderService,
          useValue: {
            chapterChanged$: chapterChangedSubject.asObservable(),
            chapterTimeZone: () => 'America/Chicago',
          },
        },
      ],
    });


    


      mockService.getAvailableUnits.calls.reset();


      mockService.createOrder.calls.reset();


      mockService.getCustomersLookup.calls.reset();


      mockService.getConsigneesLookup.calls.reset();


    fixture = TestBed.createComponent(ScheduleAutoDirectedOrderComponent);
    component = fixture.componentInstance;


    });


  it('should initialize header config on init', () => {
    fixture.detectChanges();
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.breadcrumbs.length).toBeGreaterThan(0);
    expect(component.headerConfig.title).toBe('Schedule Auto/Directed Order');
  });



  it('should generate unique component IDs across instances', () => {
    const fixture2 = TestBed.createComponent(ScheduleAutoDirectedOrderComponent);
    const component2 = fixture2.componentInstance;
    expect(component['componentId']).not.toBe(component2['componentId']);
  });

  it('should load customers on init', () => {
    fixture.detectChanges();
    expect(mockService.getCustomersLookup).toHaveBeenCalled();
    expect(component.customers().length).toBe(2);
  });

  describe('Customer selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set hospital name on customer selected', () => {
      component.customerCtrl.setValue('DAL-RG0001');
      component.onCustomerSelected();

      expect(component.hospitalName()).toBe('Parkland Hospital');
    });

    it('should reset consignee and grid when customer changes', () => {
      component.customerCtrl.setValue('DAL-RG0001');
      component.onCustomerSelected();

      component.consigneeCtrl.setValue('PAR-CS0001');
      component.consigneeName.set('Parkland Consignee');
      component.units.set(mockUnits);
      component.selectedUnitKeys.set(new Set(['W633317070115-H']));
      component.hasRetrieved.set(true);

      component.customerCtrl.setValue('OTHER001');
      component.onCustomerSelected();

      expect(component.consigneeCtrl.value).toBe('');
      expect(component.consigneeName()).toBe('—');
      expect(component.units().length).toBe(0);
      expect(component.selectedUnitKeys().size).toBe(0);
      expect(component.hasRetrieved()).toBeFalse();
    });

    it('should load consignees for selected customer', () => {
      component.customerCtrl.setValue('DAL-RG0001');
      component.onCustomerSelected();

      expect(mockService.getConsigneesLookup).toHaveBeenCalledWith('DAL-RG0001');
    });

    it('should set hospital name to dash when customer not found in list', () => {
      component.customerCtrl.setValue('NONEXISTENT');
      component.onCustomerSelected();

      expect(component.hospitalName()).toBe('—');
    });



    it('should handle consignee loading error', () => {
      mockService.getConsigneesLookup.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load consignees' } }))
      );

      component.customerCtrl.setValue('DAL-RG0001');
      component.onCustomerSelected();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load consignees');
    });
  });

  describe('Consignee selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.consignees.set(mockConsigneesLookup);
    });

    it('should set consignee name on consignee selected', () => {
      component.consigneeCtrl.setValue('PAR-CS0001');
      component.onConsigneeSelected();

      expect(component.consigneeName()).toBe('Parkland Consignee');
    });

    it('should set consignee name to dash when consignee not found in list', () => {
      component.consigneeCtrl.setValue('NONEXISTENT');
      component.onConsigneeSelected();

      expect(component.consigneeName()).toBe('—');
    });

    it('should not update name when consignee value is empty', () => {
      component.consigneeName.set('Previous Name');
      component.consigneeCtrl.setValue('');
      component.onConsigneeSelected();

      expect(component.consigneeName()).toBe('Previous Name');
    });
  });

  describe('Retrieve', () => {
    it('should be disabled when customer or consignee is empty', () => {
      component.customerCtrl.setValue('');
      component.consigneeCtrl.setValue('');
      expect(component.isRetrieveDisabled()).toBeTrue();

      component.customerCtrl.setValue('DAL-RG0001');
      expect(component.isRetrieveDisabled()).toBeTrue();

      component.consigneeCtrl.setValue('PAR-CS0001');
      expect(component.isRetrieveDisabled()).toBeFalse();
    });



    it('should load available units on retrieve', () => {
      mockService.getAvailableUnits.and.returnValue(of(successUnitsResponse));

      component.customerCtrl.setValue('DAL-RG0001');
      component.consigneeCtrl.setValue('PAR-CS0001');
      component.onRetrieve();

      expect(mockService.getAvailableUnits).toHaveBeenCalledWith({
        customerId: 'DAL-RG0001',
        consigneeId: 'PAR-CS0001',
        take: 25,
        skip: 0,
      });
      expect(component.units().length).toBe(3);
      expect(component.totalRecords()).toBe(3);
      expect(component.hasRetrieved()).toBeTrue();
    });

    it('should reset page index on retrieve', () => {
      mockService.getAvailableUnits.and.returnValue(of(successUnitsResponse));

      component.customerCtrl.setValue('DAL-RG0001');
      component.consigneeCtrl.setValue('PAR-CS0001');
      component.pageIndex.set(3);
      component.onRetrieve();

      expect(component.pageIndex()).toBe(0);
      expect(mockService.getAvailableUnits).toHaveBeenCalledWith(
        jasmine.objectContaining({ skip: 0 })
      );
    });





    it('should handle API error on retrieve', () => {
      mockService.getAvailableUnits.and.returnValue(throwError(() => new Error('Server error')));

      component.customerCtrl.setValue('DAL-RG0001');
      component.consigneeCtrl.setValue('PAR-CS0001');
      component.onRetrieve();

      expect(component.units().length).toBe(0);
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to retrieve available units'
      );
    });






  });
  describe('Selection', () => {
    beforeEach(() => {
      component.units.set(mockUnits);
    });

    it('should toggle individual unit selection', () => {
      component.onToggleUnit(mockUnits[0], true);
      expect(component.isUnitSelected(mockUnits[0])).toBeTrue();

      component.onToggleUnit(mockUnits[0], false);
      expect(component.isUnitSelected(mockUnits[0])).toBeFalse();
    });

    it('should select all units', () => {
      component.onToggleAll(true);

      expect(component.selectedUnitKeys().size).toBe(3);
      expect(component.isAllSelected()).toBeTrue();
      expect(component.isIndeterminate()).toBeFalse();
    });

    it('should deselect all units', () => {
      component.onToggleAll(true);
      component.onToggleAll(false);

      expect(component.selectedUnitKeys().size).toBe(0);
      expect(component.isAllSelected()).toBeFalse();
    });

    it('should show indeterminate state for partial selection', () => {
      component.onToggleUnit(mockUnits[0], true);

      expect(component.isIndeterminate()).toBeTrue();
      expect(component.isAllSelected()).toBeFalse();
    });


  });

  describe('Schedule Order', () => {
    beforeEach(() => {
      component.customerCtrl.setValue('DAL-RG0001');
      component.consigneeCtrl.setValue('PAR-CS0001');
      component.units.set(mockUnits);
    });





    it('should create order with selected units', () => {
      mockService.createOrder.and.returnValue(
        of({
          success: true,
          statusCode: 201,
          message: 'Order created',
          data: [{ orderNo: 'ORD001', pickSlipId: 'PS001', unitsScheduled: 2 }],
          total: 1,
        })
      );

      component.onToggleUnit(mockUnits[0], true);
      component.onToggleUnit(mockUnits[1], true);
      component.onScheduleOrder();

      expect(mockService.createOrder).toHaveBeenCalledWith({
        customerId: 'DAL-RG0001',
        consigneeId: 'PAR-CS0001',
        selectedUnits: jasmine.arrayContaining([
          { unitId: 'W633317070115-H', productCode: 'E2807100', aliquot: null },
          { unitId: 'W633317070116-H', productCode: 'E2807101', aliquot: null },
        ]),
        acknowledgeRestrictedProducts: false,
      });
    });





    it('should remove scheduled units from table', () => {
      mockService.createOrder.and.returnValue(
        of({
          success: true,
          statusCode: 201,
          message: 'Order created',
          data: [{ orderNo: 'ORD001', pickSlipId: 'PS001', unitsScheduled: 2 }],
          total: 1,
        })
      );

      component.onToggleUnit(mockUnits[0], true);
      component.onToggleUnit(mockUnits[1], true);
      component.onScheduleOrder();

      expect(component.units().length).toBe(1);
      expect(component.units()[0].unitId).toBe('W633317070117-H');
      expect(component.selectedUnitKeys().size).toBe(0);
    });

    it('should handle scheduling error', () => {
      mockService.createOrder.and.returnValue(throwError(() => new Error('Server error')));

      component.onToggleUnit(mockUnits[0], true);
      component.onScheduleOrder();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to schedule order');
      expect(component.scheduling()).toBeFalse();
    });




  });
  describe('Date formatting', () => {
    it('should format valid date with 12-hour time', () => {
      const result = component.formatDate('2025-03-01T09:00:00');
      expect(result).toContain('MAR');
      expect(result).toContain('2025');
      expect(result).toContain('AM');
    });

    it('should format PM times correctly', () => {
      const result = component.formatDate('2025-03-01T15:30:00Z');
      expect(result).toContain('MAR');
      expect(result).toContain('2025');
      expect(result).toContain('PM');
      expect(result).not.toContain('15:');
    });

    it('should format noon as 12 PM', () => {
      const result = component.formatDate('2025-03-01T12:00:00');
      expect(result).toContain('12:00 PM');
    });

    it('should format midnight as 12 AM', () => {
      const result = component.formatDate('2025-03-01T00:00:00');
      expect(result).toContain('12:00 AM');
    });




  });
});
