import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { SampleTransferOutNotCheckedInQueryComponent } from './sample-transfer-out-not-checked-in-query';
import { SampleTransferQueryService } from './services/sample-transfer-query.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ContractOption,
  TestIdOption,
  FacilityOption,
  SampleTransferQueryResponse
} from './models/sample-transfer-query.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SampleTransferOutNotCheckedInQueryComponent', () => {
  let mockChapterTimezoneService: any;
  let mockHeaderService: any;
  let component: SampleTransferOutNotCheckedInQueryComponent;
  let fixture: ComponentFixture<SampleTransferOutNotCheckedInQueryComponent>;
  let mockApiService: jasmine.SpyObj<SampleTransferQueryService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: any;

  const mockContracts: ContractOption[] = [
    { contractId: 'RC001', company: 'Test Company 1' },
    { contractId: 'RC002', company: 'Test Company 2' }
  ];

  const mockTestIds: TestIdOption[] = [
    { testId: 'HBSAG', testDesc: 'Hepatitis B Surface Antigen', testGroup: 'INF' },
    { testId: 'HIV12', testDesc: 'HIV 1/2 Antibody', testGroup: 'INF' }
  ];

  const mockFacilities: FacilityOption[] = [
    { code: 'LAB01', codeDesc: 'Laboratory 1' },
    { code: 'LAB02', codeDesc: 'Laboratory 2' }
  ];

  const mockResults: SampleTransferQueryResponse[] = [
    {
      unitId: 'W0123456789123',
      contractId: 'RC001',
      sampleType: 'FRZN',
      frozenFlag: 'Y',
      shippedOutFacility: 'LAB01',
      checkedInTime: '2026-01-15T10:30:00',
      elapsedTime: '24:15',
      boxId: 'BOX12345',
      collDate: '2026-01-14T08:00:00',
      testId: 'HBSAG'
    }
  ];

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('SampleTransferQueryService', [
      'query',
      'getContracts',
      'getTestIds',
      'getFacilities'
    ]);

    mockSnackbarService = createMockSnackbarService();

    const pageHeaderDataSignal = signal({
      title: 'Sample Transfer Out not Checked In Query',
      subtitle: 'Map external blood bank codes to internal testing facility codes if there are differences.'
    });

    mockPageHeaderService = {
      pageHeaderData: pageHeaderDataSignal,
      updateBreadcrumbs: jasmine.createSpy('updateBreadcrumbs')
    };

    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = {
      chapterLocalDate: signal(moment('2026-06-17')),
      getChapterLocalDate: jasmine.createSpy('getChapterLocalDate').and.returnValue(moment('2026-06-17')),
      getCurrentChapterDate: jasmine.createSpy('getCurrentChapterDate').and.returnValue(new Date('2026-06-17'))
    };

    const mockActivatedRoute = {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    };

    mockApiService.getContracts.and.returnValue(of(mockContracts));
    mockApiService.getTestIds.and.returnValue(of(mockTestIds));
    mockApiService.getFacilities.and.returnValue(of(mockFacilities));
    mockApiService.query.and.returnValue(of({ data: mockResults, total: 50 }));



      TestBed.configureTestingModule({
imports: [
        SampleTransferOutNotCheckedInQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SampleTransferQueryService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });


    });



  beforeEach(() => {
      mockChapterTimezoneService.getCurrentChapterDate.and.returnValue(new Date('2026-06-17'));


      mockApiService.getContracts.and.returnValue(of(mockContracts));


      mockApiService.getTestIds.and.returnValue(of(mockTestIds));


      mockApiService.getFacilities.and.returnValue(of(mockFacilities));


      mockApiService.query.and.returnValue(of({ data: mockResults, total: 50 }));


    fixture = TestBed.createComponent(SampleTransferOutNotCheckedInQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {
    it('should load all dropdown data on init', () => {
      expect(mockApiService.getContracts).toHaveBeenCalled();
      expect(mockApiService.getTestIds).toHaveBeenCalled();
      expect(mockApiService.getFacilities).toHaveBeenCalled();
    });

  });

  describe('Form Initialization', () => {

    it('should have all fields as optional', () => {
      Object.keys(component.searchForm.controls).forEach(key => {
        const control = component.searchForm.get(key);
        expect(control?.hasError('required')).toBe(false);
      });
    });
  });

  describe('Validation', () => {
    it('should validate contractId max length of 9 characters', () => {
      component.searchForm.patchValue({ contractId: 'X'.repeat(10) });
      const contractIdControl = component.searchForm.get('contractId');
      expect(contractIdControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid contractId within max length', () => {
      component.searchForm.patchValue({ contractId: 'RC001' });
      const contractIdControl = component.searchForm.get('contractId');
      expect(contractIdControl?.hasError('maxlength')).toBe(false);
    });

    it('should validate toDate cannot be before fromDate', () => {
      const fromDate = new Date('2026-12-31');
      const toDate = new Date('2026-01-01');
      component.searchForm.patchValue({ fromDate, toDate });
      component.searchForm.updateValueAndValidity();
      expect(component.searchForm.hasError('dateRangeInvalid')).toBe(true);
    });


    it('should validate facility from cannot equal facility to', () => {
      component.searchForm.patchValue({ facilityFrom: 'LAB01', facilityTo: 'LAB01' });
      component.searchForm.updateValueAndValidity();
      expect(component.searchForm.hasError('facilitySame')).toBe(true);
    });

  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ contractId: 'RC001' });
    });

    it('should call API with pagination parameters on retrieve', () => {
      component.onRetrieve();

      expect(mockApiService.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          contractId: 'RC001',
          take: 25,
          skip: 0,
          sortOrder: null,
          sortColumn: null
        })
      );
    });

    it('should populate results and total count after successful search', (done) => {
      component.onRetrieve();

      setTimeout(() => {
        expect(component['allResults']()).toEqual(mockResults);
        expect(component.tableConfig.pagination?.totalRecords).toBe(50);
        expect(component['hasSearched']()).toBe(true);
        done();
      }, 100);
    });


  });

  describe('Server-Side Pagination', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ contractId: 'RC001' });
      component['hasSearched'].set(true);
    });

    it('should call API with updated skip/take on page change', () => {
      component.onPageChange({ pageSize: 50, pageIndex: 2 });

      expect(mockApiService.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          take: 50,
          skip: 100
        })
      );
    });

    it('should call backend on each page change', () => {
      component.onPageChange({ pageSize: 25, pageIndex: 0 });
      expect(mockApiService.query).toHaveBeenCalledTimes(1);

      component.onPageChange({ pageSize: 25, pageIndex: 1 });
      expect(mockApiService.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Server-Side Sorting', () => {
    beforeEach(() => {
      component.searchForm.patchValue({ contractId: 'RC001' });
      component['hasSearched'].set(true);
    });

    it('should call API with ASC sort order when sorting ascending', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(mockApiService.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortColumn: 'unitId',
          sortOrder: 'ASC'
        })
      );
    });

    it('should call API with DESC sort order when sorting descending', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(mockApiService.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortColumn: 'unitId',
          sortOrder: 'DESC'
        })
      );
    });

    it('should call API with null sort when returning to default', () => {
      component.onSortChange({ column: 'unitId', direction: 'default' });

      expect(mockApiService.query).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortColumn: null,
          sortOrder: null
        })
      );
    });

    it('should reset page index to 0 when sorting changes', () => {
      component['pageIndex'].set(5);
      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component['pageIndex']()).toBe(0);
    });
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      component.searchForm.patchValue({
        unitId: 'W0123456789123',
        contractId: 'RC001',
        testId: 'HBSAG'
      });
      component['allResults'].set(mockResults);
      component['submitted'].set(true);
      component['hasSearched'].set(true);
      // Set search control values
      component.contractSearchCtrl.setValue('RC');
      component.testIdSearchCtrl.setValue('HBS');
      component.facilityFromSearchCtrl.setValue('LAB');
      component.facilityToSearchCtrl.setValue('LAB');
    });


    it('should clear all search controls', () => {
      component.onClearAll();

      expect(component.contractSearchCtrl.value).toBe('');
      expect(component.testIdSearchCtrl.value).toBe('');
      expect(component.facilityFromSearchCtrl.value).toBe('');
      expect(component.facilityToSearchCtrl.value).toBe('');
    });

    it('should clear results', () => {
      component.onClearAll();
      expect(component['allResults']()).toEqual([]);
    });


  });

  describe('Contract Search Filter', () => {
    beforeEach(() => {
      component['contracts'].set(mockContracts);
    });




    it('should return all contracts when search is empty', () => {
      component.contractSearchCtrl.setValue('');
      const filtered = component.filteredContracts();

      expect(filtered.length).toBe(mockContracts.length);
    });
  });

  describe('Test ID Search Filter', () => {
    beforeEach(() => {
      component['testIds'].set(mockTestIds);
    });




    it('should return all test IDs when search is empty', () => {
      component.testIdSearchCtrl.setValue('');
      const filtered = component.filteredTestIds();

      expect(filtered.length).toBe(mockTestIds.length);
    });
  });

  describe('Facility From Search Filter', () => {
    beforeEach(() => {
      component['facilities'].set(mockFacilities);
    });




    it('should return all facilities when search is empty', () => {
      component.facilityFromSearchCtrl.setValue('');
      const filtered = component.filteredFacilitiesFrom();

      expect(filtered.length).toBe(mockFacilities.length);
    });
  });

  describe('Facility To Search Filter', () => {
    beforeEach(() => {
      component['facilities'].set(mockFacilities);
    });




    it('should return all facilities when search is empty', () => {
      component.facilityToSearchCtrl.setValue('');
      const filtered = component.filteredFacilitiesTo();

      expect(filtered.length).toBe(mockFacilities.length);
    });
  });

  describe('Unit ID Validation', () => {
    it('should handle valid unit ID', () => {
      const validResponse: UnitValidationResponse = {
        parsedUnitId: 'W0123456789123',
        checkDigit: '3',
        codeScheme: 'I',
        manualUnitId: 'W0123456789123',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      };

      component.onUnitIdValidated(validResponse);
      expect(component.searchForm.get('unitId')?.value).toBe('W0123456789123');
    });

    it('should handle unit ID cleared event', () => {
      component.searchForm.patchValue({ unitId: 'W0123456789123' });
      component.onUnitIdCleared();

      expect(component.searchForm.get('unitId')?.value).toBe('');
    });
  });

  describe('Display States', () => {


    it('should format datetime fields in results', () => {
      component['allResults'].set(mockResults);
      const displayResults = component['displayResults']();

      expect(displayResults[0].checkedInTimeFormatted).toBeDefined();
      expect(displayResults[0].collDateFormatted).toBeDefined();
    });
  });

  describe('Table Configuration', () => {

    it('should use edit icon for empty state', () => {
      expect(component.tableConfig.noDataIcon).toBe('edit');
    });

  });
  describe('Accessibility', () => {
    it('should have unique element IDs for form fields', () => {
      const unitIdId = component['elementId']('unitId');
      const contractIdId = component['elementId']('contractId');

      expect(unitIdId).toContain('sample-transfer-query');
      expect(contractIdId).toContain('sample-transfer-query');
      expect(unitIdId).not.toBe(contractIdId);
    });
  });

  describe('Date Input Handling', () => {
    it('should handle from date input', () => {
      const event = { target: { value: '15-Jan-2026' } } as unknown as Event;
      component.onFromDateInput(event);
      expect(component['lastChangedDateField']).toBe('from');
    });

    it('should handle to date input', () => {
      const event = { target: { value: '20-Jan-2026' } } as unknown as Event;
      component.onToDateInput(event);
      expect(component['lastChangedDateField']).toBe('to');
    });

    it('should handle from date change and revalidate to date', () => {
      component.searchForm.patchValue({ toDate: new Date('2026-01-20') });
      component.onFromDateChange();
      expect(component['lastChangedDateField']).toBe('from');
    });

    it('should handle to date change', () => {
      component.onToDateChange();
      expect(component['lastChangedDateField']).toBe('to');
    });
  });

  describe('Date Error Messages', () => {
    it('should return from date error message', () => {
      const error = component.getFromDateError();
      expect(typeof error).toBe('string');
    });

    it('should return to date error message', () => {
      const error = component.getToDateError();
      expect(typeof error).toBe('string');
    });
  });

  describe('Dropdown Error Handling', () => {
    it('should handle contracts API error', () => {
      mockApiService.getContracts.and.returnValue(throwError(() => new Error('fail')));
      mockApiService.getTestIds.and.returnValue(of(mockTestIds));
      mockApiService.getFacilities.and.returnValue(of(mockFacilities));

      fixture = TestBed.createComponent(SampleTransferOutNotCheckedInQueryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load contracts');
    });

    it('should handle test IDs API error', () => {
      mockApiService.getContracts.and.returnValue(of(mockContracts));
      mockApiService.getTestIds.and.returnValue(throwError(() => new Error('fail')));
      mockApiService.getFacilities.and.returnValue(of(mockFacilities));

      fixture = TestBed.createComponent(SampleTransferOutNotCheckedInQueryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load test IDs');
    });

    it('should handle facilities API error', () => {
      mockApiService.getContracts.and.returnValue(of(mockContracts));
      mockApiService.getTestIds.and.returnValue(of(mockTestIds));
      mockApiService.getFacilities.and.returnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(SampleTransferOutNotCheckedInQueryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load facilities');
    });
  });

  describe('Search Error Handling', () => {
    it('should show error on invalid form submit', () => {
      component.searchForm.patchValue({ contractId: 'X'.repeat(10) });
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please correct the errors in the form');
    });

    it('should handle query API error', () => {
      mockApiService.query.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.searchForm.patchValue({ contractId: 'RC001' });
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });
  });

  describe('Display States', () => {
    it('should show empty state when no search has been performed', () => {
      component['hasSearched'].set(false);
      component['loading'].set(false);
      expect(component.showEmptyState()).toBe(true);
    });

    it('should show no results after search with no data', () => {
      component['hasSearched'].set(true);
      component['allResults'].set([]);
      component['loading'].set(false);
      expect(component.showNoResults()).toBe(true);
    });

    it('should format empty datetime as empty string', () => {
      component['allResults'].set([{
        ...mockResults[0],
        checkedInTime: '',
        collDate: ''
      }]);
      const display = component['displayResults']();
      expect(display[0].checkedInTimeFormatted).toBe('');
      expect(display[0].collDateFormatted).toBe('');
    });
  });

  describe('Search Filter with Terms', () => {
    beforeEach(() => {
      component['contracts'].set(mockContracts);
      component['testIds'].set(mockTestIds);
      component['facilities'].set(mockFacilities);
    });

    it('should filter contracts by search term', () => {
      component.contractSearchCtrl.setValue('Company 1');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('RC001');
    });

    it('should filter test IDs by search term', () => {
      component.testIdSearchCtrl.setValue('Hepatitis');
      const filtered = component.filteredTestIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('HBSAG');
    });

    it('should filter facility from by search term', () => {
      component.facilityFromSearchCtrl.setValue('Laboratory 1');
      const filtered = component.filteredFacilitiesFrom();
      expect(filtered.length).toBe(1);
    });

    it('should filter facility to by search term', () => {
      component.facilityToSearchCtrl.setValue('Laboratory 2');
      const filtered = component.filteredFacilitiesTo();
      expect(filtered.length).toBe(1);
    });
  });

  describe('maxDate uses chapter timezone', () => {
    it('should use chapter local date for maxDate', () => {
      const maxDate = component.maxDate();
      expect(maxDate).toBeDefined();
      expect(maxDate.getFullYear()).toBe(2026);
      expect(maxDate.getMonth()).toBe(5); // June = 5
      expect(maxDate.getDate()).toBe(17);
    });

    it('should fall back to current date when chapter date is null', () => {
      mockChapterTimezoneService.chapterLocalDate = signal(null);
      fixture = TestBed.createComponent(SampleTransferOutNotCheckedInQueryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const maxDate = component.maxDate();
      expect(maxDate).toBeDefined();
      expect(maxDate instanceof Date).toBe(true);
    });
  });

  describe('Form Value Changes', () => {
    it('should enable retrieve when form has value and is valid', () => {
      component.searchForm.patchValue({ contractId: 'RC001' });
      component.searchForm.updateValueAndValidity();
      expect(component['hasFormValue']()).toBe(true);
    });

    it('should disable retrieve when only one date is provided', () => {
      component.searchForm.patchValue({ fromDate: new Date('2026-01-01') });
      component.searchForm.updateValueAndValidity();
      expect(component['hasFormValue']()).toBe(false);
    });

    it('should enable retrieve when both dates are provided', () => {
      component.searchForm.patchValue({
        fromDate: new Date('2026-01-01'),
        toDate: new Date('2026-01-15')
      });
      component.searchForm.updateValueAndValidity();
      expect(component['hasFormValue']()).toBe(true);
    });
  });
});
