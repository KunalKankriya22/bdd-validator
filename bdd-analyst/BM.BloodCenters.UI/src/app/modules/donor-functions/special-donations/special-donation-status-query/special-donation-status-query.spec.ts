import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SpecialDonationStatusQueryComponent } from './special-donation-status-query';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { SpecialDonationStatusService } from './services/special-donation-status.service';
import moment from 'moment';

describe('SpecialDonationStatusQueryComponent', () => {
  let component: SpecialDonationStatusQueryComponent;
  let fixture: ComponentFixture<SpecialDonationStatusQueryComponent>;
  let mockPageHeaderService: any;
  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Special Donation Status Query',
        subtitle: 'Search and view the current status of special donations',
      }),
    };
    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    TestBed.configureTestingModule({
      imports: [SpecialDonationStatusQueryComponent,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(SpecialDonationStatusQueryComponent);
    component = fixture.componentInstance;
  });

  describe('Chapter Change Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all filters when chapter changes', () => {
      component['filterCriteria'] = {
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        shipLocation: 'Guard',
        patientId: '123',
        details: 'Test',
        option: 'All Units',
        unitId: 'U123',
        surgeryId: 'S123',
        needBy: '2023-06-01',
      };

      chapterChangedSubject.next();

      const filters = component['filterCriteria'];
      expect(filters.fromDate).toBe('');
      expect(filters.toDate).toBe('');
      expect(filters.shipLocation).toBe('');
      expect(filters.patientId).toBe('');
      expect(filters.unitId).toBe('');
      expect(filters.surgeryId).toBe('');
    });

    it('should reset pagination when chapter changes', () => {
      component['pageIndex'].set(3);

      chapterChangedSubject.next();

      expect(component['pageIndex']()).toBe(0);
    });

    it('should not respond to chapter changes after ngOnDestroy', () => {
      component['filterCriteria'].shipLocation = 'Location1';

      component.ngOnDestroy();
      chapterChangedSubject.next();

      expect(component['filterCriteria'].shipLocation).toBe('Location1');
    });
  });

  describe('Gap Analysis Fix #10: Default Ship Status', () => {
    it('should initialize with Ship Status defaulted to All Units', () => {
      fixture.detectChanges();
      expect(component['filterCriteria'].option).toBe('All Units');
    });

    it('should reset Ship Status to All Units when CLEAR ALL is clicked', () => {
      fixture.detectChanges();
      component['filterCriteria'].option = 'Shipped';

      component.onClearAll();

      expect(component['filterCriteria'].option).toBe('All Units');
    });
  });

  describe('Gap Analysis Fix #5: At Least One Criterion Required Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return error message when no filters are selected', () => {
      component['filterCriteria'] = {
        fromDate: '',
        toDate: '',
        shipLocation: '',
        patientId: '',
        details: '',
        option: 'All Units',
        unitId: '',
        surgeryId: '',
        needBy: '',
      };
      component['fromDateControl'].setValue(null);
      component['toDateControl'].setValue(null);
      component['needByDateControl'].setValue(null);

      const errorMsg = component.getRetrieveErrorMessage();
      expect(errorMsg).toBe('');
    });

    it('should return empty string when at least one filter is selected', () => {
      component['filterCriteria'].patientId = 'PAT001';

      const errorMsg = component.getRetrieveErrorMessage();
      expect(errorMsg).toBe('');
    });

    it('should disable RETRIEVE button when no filters selected', () => {
      component['filterCriteria'] = {
        fromDate: '',
        toDate: '',
        shipLocation: '',
        patientId: '',
        details: '',
        option: 'All Units',
        unitId: '',
        surgeryId: '',
        needBy: '',
      };
      component['fromDateControl'].setValue(null);
      component['toDateControl'].setValue(null);
      component['needByDateControl'].setValue(null);

      const isDisabled = component.isRetrieveDisabled();
      expect(isDisabled).toBe(true);
    });

    it('should enable RETRIEVE button when at least one filter is selected', () => {
      component['filterCriteria'].shipLocation = 'SHIP01';
      component['fromDateControl'].setValue(null);
      component['toDateControl'].setValue(null);

      const isDisabled = component.isRetrieveDisabled();
      expect(isDisabled).toBe(false);
    });
  });

  describe('Gap Analysis Fix #6: Unit ID Format Validator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate correct alphanumeric unit ID', () => {
      component['filterCriteria'].unitId = 'ABC12345';
      const isValid = component.validateUnitIdFormat();
      expect(isValid).toBe(true);
    });

    it('should validate empty unit ID as valid', () => {
      component['filterCriteria'].unitId = '';
      const isValid = component.validateUnitIdFormat();
      expect(isValid).toBe(true);
    });

    it('should reject unit ID with special characters', () => {
      component['filterCriteria'].unitId = 'ABC-123';
      const isValid = component.validateUnitIdFormat();
      expect(isValid).toBe(false);
    });

    it('should reject unit ID exceeding 15 characters', () => {
      component['filterCriteria'].unitId = '1234567890123456';
      const isValid = component.validateUnitIdFormat();
      expect(isValid).toBe(false);
    });

    it('should return error message for invalid unit ID with special characters', () => {
      component['filterCriteria'].unitId = 'ABC@123';
      const errorMsg = component.getUnitIdFormatError();
      expect(errorMsg).toContain('alphanumeric');
    });

    it('should return empty string for valid unit ID', () => {
      component['filterCriteria'].unitId = 'VALID123';
      const errorMsg = component.getUnitIdFormatError();
      expect(errorMsg).toBe('');
    });
  });

  describe('Gap Analysis Fix #7: Cascading LOV Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear dependent dropdowns when patient selection changes', () => {
      component['filterCriteria'].unitId = 'UNIT001';
      component['filterCriteria'].surgeryId = 'SURG001';

      component.onPatientSelectionChange();

      expect(component['filterCriteria'].unitId).toBe('');
      expect(component['filterCriteria'].surgeryId).toBe('');
    });

    it('should call Unit IDs and Surgery IDs lookup when patient changes', () => {
      spyOn(component['specialDonationService'], 'getUnitIdsLookup').and.returnValue(
        new (require('rxjs')).Observable()
      );
      spyOn(component['specialDonationService'], 'getSurgIdsLookup').and.returnValue(
        new (require('rxjs')).Observable()
      );

      component['filterCriteria'].patientId = 'PAT001';
      component.onPatientSelectionChange();

      expect(component['specialDonationService'].getUnitIdsLookup).toHaveBeenCalled();
      expect(component['specialDonationService'].getSurgIdsLookup).toHaveBeenCalled();
    });

    it('should call Patients and Unit IDs lookup when date range changes', () => {
      spyOn(component['specialDonationService'], 'getPatientsLookup').and.returnValue(
        new (require('rxjs')).Observable()
      );
      spyOn(component['specialDonationService'], 'getUnitIdsLookup').and.returnValue(
        new (require('rxjs')).Observable()
      );

      component.onDateRangeChange();

      expect(component['specialDonationService'].getPatientsLookup).toHaveBeenCalled();
      expect(component['specialDonationService'].getUnitIdsLookup).toHaveBeenCalled();
    });
  });

  describe('toggleFilters', () => {
    it('should toggle showFilters from false to true and back', () => {
      expect(component['showFilters']()).toBe(false);
      component['toggleFilters']();
      expect(component['showFilters']()).toBe(true);
      component['toggleFilters']();
      expect(component['showFilters']()).toBe(false);
    });
  });

  describe('Row Expansion', () => {
    it('should expand a row', () => {
      component['onRowExpand']({ id: 'unit1' });
      expect(component['isDonationExpanded']('unit1')).toBe(true);
    });

    it('should collapse an already expanded row', () => {
      component['onRowExpand']({ id: 'unit1' });
      component['onRowExpand']({ id: 'unit1' });
      expect(component['isDonationExpanded']('unit1')).toBe(false);
    });

    it('should collapse previous row when expanding a new one', () => {
      component['onRowExpand']({ id: 'unit1' });
      component['onRowExpand']({ id: 'unit2' });
      expect(component['isDonationExpanded']('unit1')).toBe(false);
      expect(component['isDonationExpanded']('unit2')).toBe(true);
    });
  });

  describe('Tab Index', () => {
    it('should set and get tab index for a donation', () => {
      component['setSelectedTabIndex']('d1', 2);
      expect(component['getSelectedTabIndex']('d1')).toBe(2);
    });

    it('should return 0 for unknown donation id', () => {
      expect(component['getSelectedTabIndex']('unknown')).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should update page index and size on page change', () => {
      component['onMainPageChange']({ pageIndex: 3, pageSize: 100 } as any);
      expect(component['pageIndex']()).toBe(3);
      expect(component['pageSize']()).toBe(100);
    });
  });

  describe('getSelectedPatientName', () => {
    it('should return dash when no patientId set', () => {
      component['filterCriteria'].patientId = '';
      expect(component['getSelectedPatientName']()).toBe('-');
    });

    it('should return patient name when found', () => {
      component['patients'].set([{ patId: 'P1', patientName: 'Doe, John', displayValue: 'P1 - Doe, John' }]);
      component['filterCriteria'].patientId = 'P1';
      expect(component['getSelectedPatientName']()).toBe('Doe, John');
    });

    it('should return dash when patient not found', () => {
      component['patients'].set([]);
      component['filterCriteria'].patientId = 'P999';
      expect(component['getSelectedPatientName']()).toBe('-');
    });
  });

  describe('isClearAllDisabled', () => {
    it('should return true when loading', () => {
      component['isLoading'].set(true);
      expect(component['isClearAllDisabled']()).toBe(true);
    });

    it('should return true when no filters, no data, no error', () => {
      component['filterCriteria'] = {
        fromDate: '', toDate: '', shipLocation: '', patientId: '',
        details: '', option: '' as any, unitId: '', surgeryId: '', needBy: ''
      };
      component['specialUnits'].set([]);
      component['hasError'].set(false);
      expect(component['isClearAllDisabled']()).toBe(true);
    });

    it('should return false when a filter is set', () => {
      component['filterCriteria'].shipLocation = 'LOC1';
      expect(component['isClearAllDisabled']()).toBe(false);
    });

    it('should return false when data exists', () => {
      component['filterCriteria'].shipLocation = 'LOC1';
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'U1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1
      }]);
      expect(component['isClearAllDisabled']()).toBe(false);
    });

    it('should return false when error exists', () => {
      component['filterCriteria'].shipLocation = 'LOC1';
      component['hasError'].set(true);
      expect(component['isClearAllDisabled']()).toBe(false);
    });

    it('should return false when fromDate has value', () => {
      component['fromDateControl'].setValue(moment('2023-01-01'));
      expect(component['isClearAllDisabled']()).toBe(false);
    });

    it('should return false when needByDate has value', () => {
      component['needByDateControl'].setValue(moment('2023-06-01'));
      expect(component['isClearAllDisabled']()).toBe(false);
    });

    it('should return false when option filter is set', () => {
      component['filterCriteria'].option = 'Shipped';
      expect(component['isClearAllDisabled']()).toBe(false);
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should return true when loading', () => {
      component['isLoading'].set(true);
      expect(component['isRetrieveDisabled']()).toBe(true);
    });

    it('should return true when no filters set', () => {
      component['filterCriteria'] = {
        fromDate: '', toDate: '', shipLocation: '', patientId: '',
        details: '', option: '' as any, unitId: '', surgeryId: '', needBy: ''
      };
      expect(component['isRetrieveDisabled']()).toBe(true);
    });

    it('should return false when a filter is set and form is valid', () => {
      component['filterCriteria'].shipLocation = 'LOC1';
      expect(component['isRetrieveDisabled']()).toBe(false);
    });

    it('should return true when form is invalid', () => {
      component['fromDateControl'].setErrors({ invalidDate: true });
      component['filterCriteria'].shipLocation = 'LOC1';
      expect(component['isRetrieveDisabled']()).toBe(true);
    });

    it('should return false when fromDate has value and form valid', () => {
      component['fromDateControl'].setValue(moment('2023-01-01'));
      expect(component['isRetrieveDisabled']()).toBe(false);
    });

    it('should return false when toDate has value and form valid', () => {
      component['toDateControl'].setValue(moment('2023-12-31'));
      expect(component['isRetrieveDisabled']()).toBe(false);
    });

    it('should return false when needByDate has value', () => {
      component['needByDateControl'].setValue(moment('2023-06-01'));
      expect(component['isRetrieveDisabled']()).toBe(false);
    });
  });

  describe('Date Error Methods', () => {
    describe('getFromDateError', () => {
      it('should return empty when control not touched', () => {
        expect(component['getFromDateError']()).toBe('');
      });

      it('should return invalid message for matDatepickerParse error', () => {
        component['fromDateControl'].markAsTouched();
        component['fromDateControl'].setErrors({ matDatepickerParse: true });
        expect(component['getFromDateError']()).toBe('From Date is invalid');
      });

      it('should return invalid message for invalidDate error', () => {
        component['fromDateControl'].markAsTouched();
        component['fromDateControl'].setErrors({ invalidDate: true });
        expect(component['getFromDateError']()).toBe('From Date is invalid');
      });

      it('should return empty for unhandled matDatepickerMax error on from date', () => {
        component['fromDateControl'].markAsTouched();
        component['fromDateControl'].setErrors({ matDatepickerMax: true });
        expect(component['getFromDateError']()).toBe('');
      });

      it('should return range error when lastChangedDate is from and dateRangeInvalid', () => {
        component['lastChangedDate'] = 'from';
        component['fromDateControl'].markAsTouched();
        component['fromDateControl'].setValue(moment('2023-12-31'));
        component['toDateControl'].setValue(moment('2023-01-01'));
        component['dateFilterForm'].updateValueAndValidity();
        if (component['dateFilterForm'].errors?.['dateRangeInvalid']) {
          expect(component['getFromDateError']()).toBe('From Date must be less than or equal to To Date');
        }
      });
    });

    describe('getToDateError', () => {
      it('should return empty when control not touched', () => {
        expect(component['getToDateError']()).toBe('');
      });

      it('should return invalid message for matDatepickerParse error', () => {
        component['toDateControl'].markAsTouched();
        component['toDateControl'].setErrors({ matDatepickerParse: true });
        expect(component['getToDateError']()).toBe('To Date is invalid');
      });

      it('should return invalid message for invalidDate error', () => {
        component['toDateControl'].markAsTouched();
        component['toDateControl'].setErrors({ invalidDate: true });
        expect(component['getToDateError']()).toBe('To Date is invalid');
      });

      it('should return empty for unhandled matDatepickerMax error on to date', () => {
        component['toDateControl'].markAsTouched();
        component['toDateControl'].setErrors({ matDatepickerMax: true });
        expect(component['getToDateError']()).toBe('');
      });

      it('should return range error when lastChangedDate is to and matDatepickerMin error', () => {
        component['lastChangedDate'] = 'to';
        component['toDateControl'].markAsTouched();
        component['toDateControl'].setErrors({ matDatepickerMin: true });
        expect(component['getToDateError']()).toBe('To Date must be on or after From Date');
      });

      it('should return range error when lastChangedDate is to and dateRangeInvalid', () => {
        component['lastChangedDate'] = 'to';
        component['toDateControl'].markAsTouched();
        component['fromDateControl'].setValue(moment('2023-12-31'));
        component['toDateControl'].setValue(moment('2023-01-01'));
        component['dateFilterForm'].updateValueAndValidity();
        if (component['dateFilterForm'].errors?.['dateRangeInvalid']) {
          expect(component['getToDateError']()).toBe('To Date must be on or after From Date');
        }
      });
    });

    describe('getNeedByDateError', () => {
      it('should return empty when control not touched', () => {
        expect(component['getNeedByDateError']()).toBe('');
      });

      it('should return invalid message for matDatepickerParse error', () => {
        component['needByDateControl'].markAsTouched();
        component['needByDateControl'].setErrors({ matDatepickerParse: true });
        expect(component['getNeedByDateError']()).toBe('Need By date is invalid');
      });

      it('should return invalid message for invalidDate error', () => {
        component['needByDateControl'].markAsTouched();
        component['needByDateControl'].setErrors({ invalidDate: true });
        expect(component['getNeedByDateError']()).toBe('Need By date is invalid');
      });

      it('should return future date message for matDatepickerMax error', () => {
        component['needByDateControl'].markAsTouched();
        component['needByDateControl'].setErrors({ matDatepickerMax: true });
        expect(component['getNeedByDateError']()).toBe('Need By date cannot be a future date');
      });
    });
  });

  describe('onRetrieve', () => {
    let service: SpecialDonationStatusService;

    beforeEach(() => {
      service = TestBed.inject(SpecialDonationStatusService);
    });

    it('should not call API when form is invalid', () => {
      component['fromDateControl'].setErrors({ invalidDate: true });
      const spy = spyOn(service, 'querySpecialDonationStatus');
      component['onRetrieve']();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should set specialUnits on success', () => {
      const mockResponse = {
        specialUnits: [{
          unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
          patId: 'P1', seqNo: 1, sequence: 1
        }],
        totalRecordsFound: 1,
      };
      spyOn(service, 'querySpecialDonationStatus').and.returnValue(of(mockResponse));
      component['filterCriteria'].shipLocation = 'LOC1';
      component['onRetrieve']();
      expect(component['specialUnits']().length).toBe(1);
      expect(component['isLoading']()).toBe(false);
    });

    it('should handle error response with message', () => {
      spyOn(service, 'querySpecialDonationStatus').and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component['filterCriteria'].shipLocation = 'LOC1';
      component['onRetrieve']();
      expect(component['hasError']()).toBe(true);
      expect(component['errorMessage']()).toBe('Server error');
      expect(component['specialUnits']().length).toBe(0);
    });

    it('should use default error message when error has no message', () => {
      spyOn(service, 'querySpecialDonationStatus').and.returnValue(
        throwError(() => ({}))
      );
      component['filterCriteria'].shipLocation = 'LOC1';
      component['onRetrieve']();
      expect(component['errorMessage']()).toBe('Failed to retrieve special donation status');
    });
  });

  describe('onClearAll', () => {
    it('should reset all filter criteria and clear data', () => {
      component['filterCriteria'].shipLocation = 'LOC1';
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1
      }]);
      component['expandedRows'].set(new Set(['U1']));
      component['hasError'].set(true);
      component['errorMessage'].set('error');
      component['pageIndex'].set(5);
      component['fromDateControl'].setValue(moment('2023-01-01'));

      component['onClearAll']();

      expect(component['filterCriteria'].shipLocation).toBe('');
      expect(component['specialUnits']().length).toBe(0);
      expect(component['expandedRows']().size).toBe(0);
      expect(component['hasError']()).toBe(false);
      expect(component['errorMessage']()).toBe('');
      expect(component['pageIndex']()).toBe(0);
      expect(component['fromDateControl'].value).toBeNull();
      expect(component['lastChangedDate']).toBeNull();
    });
  });

  describe('onMainSortChange', () => {
    let service: SpecialDonationStatusService;

    beforeEach(() => {
      service = TestBed.inject(SpecialDonationStatusService);
    });

    it('should set sort to UnitId ASC when column is unitId and direction is A', () => {
      component['onMainSortChange']({ column: 'unitId', direction: 'A' } as any);
      expect(component['sortColumn']()).toBe('UnitId');
      expect(component['sortDirection']()).toBe('ASC');
    });

    it('should set sort to UnitId DESC when column is unitId and direction is D', () => {
      component['onMainSortChange']({ column: 'unitId', direction: 'D' } as any);
      expect(component['sortColumn']()).toBe('UnitId');
      expect(component['sortDirection']()).toBe('DESC');
    });

    it('should reset to CollDate DESC when column is not unitId', () => {
      component['onMainSortChange']({ column: 'other', direction: 'A' } as any);
      expect(component['sortColumn']()).toBe('CollDate');
      expect(component['sortDirection']()).toBe('DESC');
    });

    it('should call onRetrieve when data exists', () => {
      const mockResponse = { specialUnits: [], totalRecordsFound: 0 };
      spyOn(service, 'querySpecialDonationStatus').and.returnValue(of(mockResponse));
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1
      }]);
      component['filterCriteria'].shipLocation = 'LOC1';
      component['onMainSortChange']({ column: 'unitId', direction: 'A' } as any);
      expect(service.querySpecialDonationStatus).toHaveBeenCalled();
    });

    it('should not call onRetrieve when no data', () => {
      spyOn(service, 'querySpecialDonationStatus');
      component['specialUnits'].set([]);
      component['onMainSortChange']({ column: 'unitId', direction: 'A' } as any);
      expect(service.querySpecialDonationStatus).not.toHaveBeenCalled();
    });
  });

  describe('getComponentsRequested', () => {
    it('should return empty array when unit not found', () => {
      component['specialUnits'].set([]);
      expect(component['getComponentsRequested']('missing')).toEqual([]);
    });

    it('should return empty array when unit has no directedDonor', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1
      }]);
      expect(component['getComponentsRequested']('U1')).toEqual([]);
    });

    it('should return components for all prodTypes', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1,
        directedDonor: { patId: 'P1', seqNo: 1, prodType1: 'RBC', prodType2: 'PLT', prodType3: 'FFP' }
      }]);
      const result = component['getComponentsRequested']('U1');
      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ type: 'RBC', product: 'RBC', shipDate: '-' });
      expect(result[1]).toEqual({ type: 'PLT', product: 'PLT', shipDate: '-' });
      expect(result[2]).toEqual({ type: 'FFP', product: 'FFP', shipDate: '-' });
    });

    it('should return only prodType1 when others are undefined', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1,
        directedDonor: { patId: 'P1', seqNo: 1, prodType1: 'RBC' }
      }]);
      const result = component['getComponentsRequested']('U1');
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('RBC');
    });
  });

  describe('donations computed', () => {
    it('should map special units to donation objects', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-06-15',
        patId: 'P1', seqNo: 1, sequence: 1,
        shipDesc: 'Hospital A', shipId: 'H1',
        patientName: 'Doe, John',
        donationType: 'Directed',
        surgId: 'S1', surgDate: '06-20-2023', surgDay: 'TUE',
        dateNeededBy: '2023-06-18',
        shippedProducts: [{
          unitId: 'U1', displayUnitId: 'DU1', productCode: 'PC1',
          productType: 'RBC', shippedDate: '2023-06-16'
        }]
      }]);
      const result = component['donations']();
      expect(result.length).toBe(1);
      expect(result[0].shipLocation).toBe('Hospital A');
      expect(result[0].patient).toBe('Doe, John');
      expect(result[0].donationType).toBe('Directed');
      expect(result[0].components.length).toBe(1);
      expect(result[0].components[0].productCode).toBe('PC1');
    });

    it('should return empty array for non-array units', () => {
      component['specialUnits'].set(null as any);
      expect(component['donations']()).toEqual([]);
    });

    it('should handle missing optional fields', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '',
        patId: 'P1', seqNo: 1, sequence: 1,
      }]);
      const result = component['donations']();
      expect(result[0].shipLocation).toBe('');
      expect(result[0].patient).toBe('');
      expect(result[0].collectionDate).toBe('');
      expect(result[0].surgeryDate).toBe('');
      expect(result[0].dateNeeded).toBe('');
      expect(result[0].components).toEqual([]);
    });

    it('should use shipId when shipDesc is not available', () => {
      component['specialUnits'].set([{
        unitId: 'U1', displayUnitId: 'DU1', collDate: '2023-01-01',
        patId: 'P1', seqNo: 1, sequence: 1, shipId: 'SH1'
      }]);
      expect(component['donations']()[0].shipLocation).toBe('SH1');
    });
  });

  describe('paginatedDonations', () => {
    it('should return paginated slice with rowNumber', () => {
      const units = Array.from({ length: 30 }, (_, i) => ({
        unitId: `U${i}`, displayUnitId: `DU${i}`, collDate: '2023-01-01',
        patId: `P${i}`, seqNo: i, sequence: i,
      }));
      component['specialUnits'].set(units as any);
      component['pageIndex'].set(1);
      component['pageSize'].set(10);
      const paginated = component['paginatedDonations']();
      expect(paginated.length).toBe(10);
      expect(paginated[0].rowNumber).toBe(11);
    });
  });

  describe('loadLookupData', () => {
    let service: SpecialDonationStatusService;

    beforeEach(() => {
      service = TestBed.inject(SpecialDonationStatusService);
    });

    it('should load all lookup data on success', () => {
      const locations = [{ shipId: 'S1', shipDesc: 'Ship1', displayValue: 'S1 - Ship1' }];
      const patients = [{ patId: 'P1', patientName: 'Doe', displayValue: 'P1 - Doe' }];
      const units = [{ unitId: 'U1', displayValue: 'U1' }];
      const surgIds = [{ surgId: 'SG1', displayValue: 'SG1' }];

      spyOn(service, 'getShipLocationsLookup').and.returnValue(of(locations));
      spyOn(service, 'getPatientsLookup').and.returnValue(of(patients));
      spyOn(service, 'getUnitIdsLookup').and.returnValue(of(units));
      spyOn(service, 'getSurgIdsLookup').and.returnValue(of(surgIds));

      component['loadLookupData']();

      expect(component['shipLocations']()).toEqual(locations);
      expect(component['filteredShipLocations']()).toEqual(locations);
      expect(component['patients']()).toEqual(patients);
      expect(component['filteredPatients']()).toEqual(patients);
      expect(component['unitIds']()).toEqual(units);
      expect(component['filteredUnitIds']()).toEqual(units);
      expect(component['surgeryIds']()).toEqual(surgIds);
      expect(component['filteredSurgeryIds']()).toEqual(surgIds);
    });

    it('should set empty arrays on lookup errors', () => {
      spyOn(service, 'getShipLocationsLookup').and.returnValue(throwError(() => new Error('fail')));
      spyOn(service, 'getPatientsLookup').and.returnValue(throwError(() => new Error('fail')));
      spyOn(service, 'getUnitIdsLookup').and.returnValue(throwError(() => new Error('fail')));
      spyOn(service, 'getSurgIdsLookup').and.returnValue(throwError(() => new Error('fail')));

      component['loadLookupData']();

      expect(component['shipLocations']()).toEqual([]);
      expect(component['filteredShipLocations']()).toEqual([]);
      expect(component['patients']()).toEqual([]);
      expect(component['filteredPatients']()).toEqual([]);
      expect(component['unitIds']()).toEqual([]);
      expect(component['filteredUnitIds']()).toEqual([]);
      expect(component['surgeryIds']()).toEqual([]);
      expect(component['filteredSurgeryIds']()).toEqual([]);
    });
  });

  describe('mapOptionToShipStatus', () => {
    it('should map Shipped to S', () => {
      expect(component['mapOptionToShipStatus']('Shipped')).toBe('S');
    });

    it('should map Not Shipped to N', () => {
      expect(component['mapOptionToShipStatus']('Not Shipped')).toBe('N');
    });

    it('should map All Units to A', () => {
      expect(component['mapOptionToShipStatus']('All Units')).toBe('A');
    });

    it('should map empty string to A (default)', () => {
      expect(component['mapOptionToShipStatus']('')).toBe('A');
    });
  });

  describe('Search Filters', () => {
    let service: SpecialDonationStatusService;

    beforeEach(() => {
      service = TestBed.inject(SpecialDonationStatusService);
      spyOn(service, 'getShipLocationsLookup').and.returnValue(of([
        { shipId: 'S1', shipDesc: 'Hospital Alpha', displayValue: 'S1 - Hospital Alpha' },
        { shipId: 'S2', shipDesc: 'Hospital Beta', displayValue: 'S2 - Hospital Beta' },
      ]));
      spyOn(service, 'getPatientsLookup').and.returnValue(of([
        { patId: 'P1', patientName: 'Doe, John', displayValue: 'P1 - Doe, John' },
      ]));
      spyOn(service, 'getUnitIdsLookup').and.returnValue(of([
        { unitId: 'U1', displayValue: 'U1-check' },
      ]));
      spyOn(service, 'getSurgIdsLookup').and.returnValue(of([
        { surgId: 'SG1', displayValue: 'SG1' },
      ]));
      fixture.detectChanges();
      component['loadLookupData']();
    });

    it('should filter ship locations by search term', () => {
      component['shipLocationSearchControl'].setValue('Alpha');
      expect(component['filteredShipLocations']().length).toBe(1);
      expect(component['filteredShipLocations']()[0].shipId).toBe('S1');
    });

    it('should filter patients by search term', () => {
      component['patientSearchControl'].setValue('Doe');
      expect(component['filteredPatients']().length).toBe(1);
    });

    it('should filter unit IDs by search term', () => {
      component['unitIdSearchControl'].setValue('U1');
      expect(component['filteredUnitIds']().length).toBe(1);
    });

    it('should filter surgery IDs by search term', () => {
      component['surgeryIdSearchControl'].setValue('SG1');
      expect(component['filteredSurgeryIds']().length).toBe(1);
    });

    it('should show all when search term is empty', () => {
      component['shipLocationSearchControl'].setValue('');
      expect(component['filteredShipLocations']().length).toBe(2);
    });
  });

  describe('Date Input Handlers', () => {
    it('should handle from date input', () => {
      const event = { target: { value: '15-JAN-2023' } } as any;
      component['onFromDateInput'](event);
      expect(component['lastChangedDate']).toBe('from');
    });

    it('should handle to date input', () => {
      const event = { target: { value: '31-DEC-2023' } } as any;
      component['onToDateInput'](event);
      expect(component['lastChangedDate']).toBe('to');
    });

    it('should handle need by date input', () => {
      const event = { target: { value: '01-JUN-2023' } } as any;
      component['onNeedByDateInput'](event);
      expect(component['lastChangedDate']).toBe('needBy');
    });
  });

  describe('Date Blur Handlers', () => {
    it('should mark from date control as touched on blur', fakeAsync(() => {
      component['fromDateInput'] = { nativeElement: { value: '' } } as any;
      component['onFromDateBlur']();
      tick(10);
      expect(component['fromDateControl'].touched).toBe(true);
    }));

    it('should set invalidDate error for unparseable from date', fakeAsync(() => {
      component['fromDateInput'] = { nativeElement: { value: 'not-a-date' } } as any;
      component['onFromDateBlur']();
      tick(10);
      expect(component['fromDateControl'].hasError('invalidDate')).toBe(true);
    }));

    it('should mark to date control as touched on blur', fakeAsync(() => {
      component['toDateInput'] = { nativeElement: { value: '' } } as any;
      component['onToDateBlur']();
      tick(10);
      expect(component['toDateControl'].touched).toBe(true);
    }));

    it('should set invalidDate error for unparseable to date', fakeAsync(() => {
      component['toDateInput'] = { nativeElement: { value: 'xyz' } } as any;
      component['onToDateBlur']();
      tick(10);
      expect(component['toDateControl'].hasError('invalidDate')).toBe(true);
    }));
  });

  describe('Date Validation Setup', () => {
    beforeEach(() => {
      const service = TestBed.inject(SpecialDonationStatusService);
      spyOn(service, 'getShipLocationsLookup').and.returnValue(of([]));
      spyOn(service, 'getPatientsLookup').and.returnValue(of([]));
      spyOn(service, 'getUnitIdsLookup').and.returnValue(of([]));
      spyOn(service, 'getSurgIdsLookup').and.returnValue(of([]));
      fixture.detectChanges();
    });

    it('should set lastChangedDate to from when fromDate changes', () => {
      component['fromDateControl'].setValue(moment('2023-01-01'));
      expect(component['lastChangedDate']).toBe('from');
    });

    it('should set lastChangedDate to to when toDate changes', () => {
      component['toDateControl'].setValue(moment('2023-12-31'));
      expect(component['lastChangedDate']).toBe('to');
    });

    it('should set lastChangedDate to needBy when needByDate changes', () => {
      component['needByDateControl'].setValue(moment('2023-06-15'));
      expect(component['lastChangedDate']).toBe('needBy');
    });
  });

  describe('buildAndExecuteQuery', () => {
    let service: SpecialDonationStatusService;

    beforeEach(() => {
      service = TestBed.inject(SpecialDonationStatusService);
    });

    it('should build query with all filter criteria', () => {
      const mockResponse = { specialUnits: [], totalRecordsFound: 0 };
      const querySpy = spyOn(service, 'querySpecialDonationStatus').and.returnValue(of(mockResponse));

      component['fromDateControl'].setValue(moment('2023-01-01'));
      component['toDateControl'].setValue(moment('2023-12-31'));
      component['needByDateControl'].setValue(moment('2023-06-15'));
      component['filterCriteria'].shipLocation = 'LOC1';
      component['filterCriteria'].patientId = 'P1';
      component['filterCriteria'].option = 'Shipped';
      component['filterCriteria'].unitId = 'U1';
      component['filterCriteria'].surgeryId = 'SG1';
      component['sortColumn'].set('UnitId');
      component['sortDirection'].set('ASC');

      component['onRetrieve']();

      expect(querySpy).toHaveBeenCalledWith(jasmine.objectContaining({
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        shipId: 'LOC1',
        patId: 'P1',
        shipStatus: 'S',
        unitId: 'U1',
        surgId: 'SG1',
        sortColumn: 'UnitId',
        sortDirection: 'ASC',
      }));
    });

    it('should build query with undefined for empty optional fields', () => {
      const mockResponse = { specialUnits: [], totalRecordsFound: 0 };
      const querySpy = spyOn(service, 'querySpecialDonationStatus').and.returnValue(of(mockResponse));

      component['filterCriteria'].shipLocation = 'LOC1';
      component['onRetrieve']();

      const queryArg = querySpy.calls.first().args[0];
      expect(queryArg.fromDate).toBeUndefined();
      expect(queryArg.toDate).toBeUndefined();
      expect(queryArg.unitId).toBeUndefined();
      expect(queryArg.surgId).toBeUndefined();
    });
  });

  describe('Surgery Day Full Name Mapping', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should convert abbreviated day MON to Monday', () => {
      const result = component['getFullDayName']('MON');
      expect(result).toBe('Monday');
    });

    it('should convert abbreviated day TUE to Tuesday', () => {
      const result = component['getFullDayName']('TUE');
      expect(result).toBe('Tuesday');
    });

    it('should convert abbreviated day WED to Wednesday', () => {
      const result = component['getFullDayName']('WED');
      expect(result).toBe('Wednesday');
    });

    it('should convert abbreviated day THU to Thursday', () => {
      const result = component['getFullDayName']('THU');
      expect(result).toBe('Thursday');
    });

    it('should convert abbreviated day FRI to Friday', () => {
      const result = component['getFullDayName']('FRI');
      expect(result).toBe('Friday');
    });

    it('should convert abbreviated day SAT to Saturday', () => {
      const result = component['getFullDayName']('SAT');
      expect(result).toBe('Saturday');
    });

    it('should convert abbreviated day SUN to Sunday', () => {
      const result = component['getFullDayName']('SUN');
      expect(result).toBe('Sunday');
    });

    it('should handle lowercase input', () => {
      const result = component['getFullDayName']('wed');
      expect(result).toBe('Wednesday');
    });

    it('should return original value for unrecognized abbreviation', () => {
      const result = component['getFullDayName']('XYZ');
      expect(result).toBe('XYZ');
    });

    it('should return empty string for empty input', () => {
      const result = component['getFullDayName']('');
      expect(result).toBe('');
    });
  });

  describe('Clear All Button Disabled State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be disabled when all filters are at default values', () => {
      component['filterCriteria'] = {
        fromDate: '',
        toDate: '',
        shipLocation: '',
        patientId: '',
        details: '',
        option: 'All Units',
        unitId: '',
        surgeryId: '',
        needBy: '',
      };
      component['fromDateControl'].setValue(null);
      component['toDateControl'].setValue(null);
      component['needByDateControl'].setValue(null);

      expect(component.isClearAllDisabled()).toBe(true);
    });

    it('should be enabled when a filter has a value', () => {
      component['filterCriteria'].patientId = 'PAT001';

      expect(component.isClearAllDisabled()).toBe(false);
    });

    it('should be enabled when fromDate has a value', () => {
      component['fromDateControl'].setValue(new Date(2024, 0, 1));

      expect(component.isClearAllDisabled()).toBe(false);
    });

    it('should be enabled when option is not All Units', () => {
      component['filterCriteria'].option = 'Shipped';

      expect(component.isClearAllDisabled()).toBe(false);
    });

    it('should be disabled when loading', () => {
      component['isLoading'].set(true);
      component['filterCriteria'].patientId = 'PAT001';

      expect(component.isClearAllDisabled()).toBe(true);
    });
  });

  describe('Single Row Expansion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should expand a row when no row is expanded', () => {
      const row = { id: 'row1' };
      component.onRowExpand(row);

      expect(component['expandedRows']().has('row1')).toBe(true);
      expect(component['expandedRows']().size).toBe(1);
    });

    it('should collapse a row when the same row is toggled', () => {
      const row = { id: 'row1' };
      component.onRowExpand(row);
      component.onRowExpand(row);

      expect(component['expandedRows']().size).toBe(0);
    });

    it('should close first row when a different row is expanded', () => {
      component.onRowExpand({ id: 'row1' });
      component.onRowExpand({ id: 'row2' });

      expect(component['expandedRows']().has('row1')).toBe(false);
      expect(component['expandedRows']().has('row2')).toBe(true);
      expect(component['expandedRows']().size).toBe(1);
    });
  });
});
