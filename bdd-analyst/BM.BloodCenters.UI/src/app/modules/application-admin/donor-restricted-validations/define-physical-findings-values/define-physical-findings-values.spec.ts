import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { HeaderService } from '@shared/services/header.service';

import { DefinePhysicalFindingsValuesComponent } from './define-physical-findings-values';
import { DefinePhysicalFindingsValuesService } from './services/define-physical-findings-values.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DefinePhysicalFindingsValuesModel,
  DefinePhysicalFindingsValuesResponse
} from './models/define-physical-findings-values.model';
import { DefinePhysicalFindingsValuesFilterFormValue } from './utils/filter-chips.utils';

describe('DefinePhysicalFindingsValuesComponent', () => {
  let component: DefinePhysicalFindingsValuesComponent;
  let fixture: ComponentFixture<DefinePhysicalFindingsValuesComponent>;
  let mockService: jasmine.SpyObj<DefinePhysicalFindingsValuesService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: any;

  const mockLookups = {
    donationTypes: [
      { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' },
      { key: 'DI', value: 'Directed' }
    ],
    procedureCodes: [
      { key: 'm9', value: 'test m9' },
      { key: 'WB', value: 'Whole Blood' }
    ],
    physicalCodes: [
      { key: 'AGE', value: 'Donor age not acceptable' },
      { key: 'PULEV', value: 'Pulse Evaluation' }
    ],
    interdictionCodes: [
      { key: '00008', value: 'Test Interdiction 1' },
      { key: '00009', value: 'Test Interdiction 2' }
    ],
    equipmentTypes: [
      { key: '500', value: 'Equipment Type 500' },
      { key: '1000', value: 'Equipment Type 1000' }
    ],
    operators: [
      { key: 'BETWEEN', value: 'BETWEEN' },
      { key: 'EQUAL', value: 'EQUAL' }
    ]
  };

  const mockPhysicalRulesData: DefinePhysicalFindingsValuesModel[] = [
    {
      physicalCode: 'AGE',
      physicalCodeDescription: 'Donor age not acceptable',
      dataType: 'N',
      minimumValue: '11',
      maximumValue: '112',
      operator: 'BETWEEN',
      gender: 'A',
      fromAge: 11,
      toAge: 111,
      interdiction: '00008',
      interdictionDescription: 'Test Interdiction 1',
      equipmentType: '1000',
      equipmentTypeDescription: 'Equipment Type 1000',
      commentsRequired: 'Y',
      manualAuditRequired: 'Y',
      effectiveDate: '2026-04-02T13:00:00',
      terminationDate: '2026-04-29T13:00:00',
      donationType: 'UAT2',
      donationTypeDescription: 'LOCAL TIME TESTING UAT 2',
      procedureCode: 'm9',
      procedureCodeDescription: 'test m9'
    },
    {
      physicalCode: 'APRNC',
      physicalCodeDescription: 'Appearance',
      dataType: 'N',
      minimumValue: '122',
      maximumValue: '222',
      operator: 'EQUAL',
      gender: 'A',
      fromAge: 22,
      toAge: 222,
      interdiction: '00009',
      interdictionDescription: 'Test Interdiction 2',
      equipmentType: '500',
      equipmentTypeDescription: 'Equipment Type 500',
      commentsRequired: 'Y',
      manualAuditRequired: 'Y',
      effectiveDate: '2026-04-02T13:00:00',
      terminationDate: '2026-04-29T13:00:00',
      donationType: 'UAT2',
      donationTypeDescription: 'LOCAL TIME TESTING UAT 2',
      procedureCode: 'm9',
      procedureCodeDescription: 'test m9'
    }
  ];

  const mockResponse: DefinePhysicalFindingsValuesResponse = {
    data: mockPhysicalRulesData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefinePhysicalFindingsValuesService', [
      'getDefinePhysicalFindingsValues',
      'getLookups',
      'createPhysicalRule',
      'updatePhysicalRule'
    ]);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    mockService.getLookups.and.returnValue(of(mockLookups));
    mockService.getDefinePhysicalFindingsValues.and.returnValue(of(mockResponse));



      TestBed.configureTestingModule({
      imports: [
        DefinePhysicalFindingsValuesComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
        provideRouter([]),
        { provide: DefinePhysicalFindingsValuesService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });


    


      mockService.getDefinePhysicalFindingsValues.calls.reset();


      mockService.getLookups.calls.reset();


      mockService.createPhysicalRule.calls.reset();


      mockService.updatePhysicalRule.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getTitle.and.returnValue('');


      mockPageHeaderService.getSubtitle.and.returnValue('');


      mockService.getLookups.and.returnValue(of(mockLookups));


      mockService.getDefinePhysicalFindingsValues.and.returnValue(of(mockResponse));


    fixture = TestBed.createComponent(DefinePhysicalFindingsValuesComponent);
    component = fixture.componentInstance;


    });


  describe('Component Initialization', () => {
    it('should initialize with default configurations', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.searchConfig).toBeDefined();
      expect(component.tableConfig).toBeDefined();
      expect(component.isLoading).toBe(false);
      expect(component.hasError).toBe(false);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.isFilterOpen).toBe(false);
    });

    it('should create top filter form on ngOnInit', () => {
      fixture.detectChanges();
      expect(component.topFilterForm).toBeDefined();
      expect(component.topFilterForm.get('donationType')).toBeDefined();
      expect(component.topFilterForm.get('procedureCode')).toBeDefined();
    });

    it('should load lookups on ngOnInit', () => {
      fixture.detectChanges();
      expect(mockService.getLookups).toHaveBeenCalled();
      expect(component.lookupsData).toEqual(mockLookups);
      expect(component.filteredDonationTypes().length).toBe(2);
      expect(component.filteredProcedureCodes().length).toBe(2);
    });






  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load data when onRetrieve is called', () => {
      const donationObj = { key: 'UAT2', value: 'LOCAL TIME TESTING UAT 2' };
      const procedureObj = { key: 'm9', value: 'test m9' };
      component.topFilterForm.patchValue({
        donationType: donationObj,
        procedureCode: procedureObj
      });

      component.onRetrieve();

      expect(component.requestState.donationType).toBe('UAT2');
      expect(component.requestState.procedureCode).toBe('m9');
      expect(mockService.getDefinePhysicalFindingsValues).toHaveBeenCalled();
    });



    it('should populate dataSource on successful load', (done) => {
      component.loadData();

      setTimeout(() => {
        expect(component.dataSource).toEqual(mockPhysicalRulesData);
        expect(component.tableConfig.pagination!.totalRecords).toBe(2);
        expect(component.isLoading).toBe(false);
        expect(component.hasError).toBe(false);
        done();
      }, 100);
    });

    it('should handle error during data load', (done) => {
      mockService.getDefinePhysicalFindingsValues.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();

      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.isLoading).toBe(false);
        expect(component.errorMessage).toBeTruthy();
        done();
      }, 100);
    });

    it('should reset pagination to first page on retrieve', () => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onRetrieve();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update request state with search keyword', () => {
      const searchText = 'AGE';
      component.onSearch(searchText);

      expect(component.searchText).toBe(searchText);
      expect(component.requestState.searchKeyword).toBe(searchText);
    });






  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should load data with correct skip and take values', () => {
      component.tableConfig.pagination!.pageIndex = 1;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      expect(mockService.getDefinePhysicalFindingsValues).toHaveBeenCalledWith(
        25,
        25,
        jasmine.any(Object)
      );
    });
  });



  describe('Filter Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should generate filter chips when filters applied', () => {
      const filters: DefinePhysicalFindingsValuesFilterFormValue = {
        operator: 'EQUAL',
        interdiction: null,
        manualAuditFindingsFlag: null,
        equipmentType: null,
        effectiveDate: null,
        periodType: null,
        terminationDate: null,
        terminationPeriodType: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });






  });

  describe('Side Panel Operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should pre-populate sidePanelData with requestState donationType and procedureCode when retrieve has been performed', () => {
      component.requestState.donationType = 'UAT2';
      component.requestState.procedureCode = 'm9';

      component.createRecord();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).not.toBeNull();
      expect(component.sidePanelData!.donationType).toBe('UAT2');
      expect(component.sidePanelData!.procedureCode).toBe('m9');
    });



    it('should pre-populate sidePanelData when only donationType is in requestState', () => {
      component.requestState.donationType = 'UAT2';

      component.createRecord();

      expect(component.sidePanelData).not.toBeNull();
      expect(component.sidePanelData!.donationType).toBe('UAT2');
    });






  });





  describe('Value Formatters', () => {
    it('should format data type values', () => {
      const columns = component['getTableColumns']();
      const dataTypeColumn = columns.find(c => c.key === 'dataType');
      const mockRow = mockPhysicalRulesData[0];

      expect(dataTypeColumn?.valueFormatter?.('N', mockRow)).toBe('Numeric');
      expect(dataTypeColumn?.valueFormatter?.('C', mockRow)).toBe('Character');
      expect(dataTypeColumn?.valueFormatter?.('D', mockRow)).toBe('Decimal');
    });

    it('should format gender values', () => {
      const columns = component['getTableColumns']();
      const genderColumn = columns.find(c => c.key === 'gender');
      const mockRow = mockPhysicalRulesData[0];

      expect(genderColumn?.valueFormatter?.('M', mockRow)).toBe('Male');
      expect(genderColumn?.valueFormatter?.('F', mockRow)).toBe('Female');
      expect(genderColumn?.valueFormatter?.('A', mockRow)).toBe('All');
    });






  });
  describe('Date Conversion', () => {
    it('should convert date to ISO string without timezone', () => {
      const date = new Date('2026-04-02');
      const isoString = component['toISOStringWithoutTimezone'](date);

      expect(isoString).toContain('2026-04-02');
      expect(isoString).toContain('T12:00:00.000Z');
    });
  });

  describe('Searchable Select - Top Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set up filtered computed signals after lookups load', () => {
      expect(component.filteredDonationTypes).toBeDefined();
      expect(component.filteredProcedureCodes).toBeDefined();
      expect(component.filteredDonationTypes().length).toBe(2);
      expect(component.filteredProcedureCodes().length).toBe(2);
    });

    it('should compare lookup items by key', () => {
      const a = { key: 'UAT2', value: 'Test' };
      const b = { key: 'UAT2', value: 'Different' };
      const c = { key: 'DI', value: 'Test' };

      expect(component.compareLookupItems(a, b)).toBe(true);
      expect(component.compareLookupItems(a, c)).toBe(false);
      expect(component.compareLookupItems(null, b)).toBe(false);
    });









    it('should return all items when search text is empty', () => {
      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes().length).toBe(2);
    });


  });

  describe('Active Filters Detection', () => {
    it('should detect when filters are active', () => {
      component.appliedFilters = {
        operator: 'BETWEEN',
        interdiction: null,
        manualAuditFindingsFlag: null,
        equipmentType: null,
        effectiveDate: null,
        periodType: null,
        terminationDate: null,
        terminationPeriodType: null
      };

      expect(component.hasActiveFilters).toBe(true);
    });

    it('should detect when no filters are active', () => {
      component.appliedFilters = null;

      expect(component.hasActiveFilters).toBe(false);
    });
  });
});
