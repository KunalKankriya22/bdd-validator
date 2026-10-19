import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { ValidDonationTypeProcedureCodesComponent } from './valid-donation-type-procedure-codes';
import { ValidDonationTypeProcedureCodesService } from './services/valid-donation-type-procedure-codes.service';
import {
  ValidDonationTypeProcedureCodesModel,
  ValidDonationTypeProcedureCodesFilterValue
} from './models/valid-donation-type-procedure-codes.model';

describe('ValidDonationTypeProcedureCodesComponent', () => {
  let spy: any;
  let component: ValidDonationTypeProcedureCodesComponent;
  let fixture: ComponentFixture<ValidDonationTypeProcedureCodesComponent>;
  let serviceSpy: jasmine.SpyObj<ValidDonationTypeProcedureCodesService>;

  const mockData: ValidDonationTypeProcedureCodesModel[] = [
    {
      donationType: 'WB',
      procedureCode: 'WBL',
      attribGroup: 'PROC',
      attribCode: 'TEST1',
      effectiveDate: '2024-01-01',
      terminationDate: '2024-12-31',
      modificationDate: '2024-01-15',
      sortSequence: 1
    },
    {
      donationType: 'PLT',
      procedureCode: 'APLT',
      attribGroup: 'QUAL',
      attribCode: 'TEST2',
      effectiveDate: '2024-02-01',
      terminationDate: null,
      modificationDate: '2024-02-15',
      sortSequence: 2
    }
  ];

  beforeEach(() => {

    spy = jasmine.createSpyObj('ValidDonationTypeProcedureCodesService', [
      'getValidDonationTypeProcedureCodes',
      'addAttributeMapping',
      'updateAttributeMapping',
      'getFilterOptions',
      'getAttributeCodes'
    ]);



      TestBed.configureTestingModule({
      imports: [
        ValidDonationTypeProcedureCodesComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ValidDonationTypeProcedureCodesService, useValue: spy }
      ]
    });


    


      spy.getValidDonationTypeProcedureCodes.calls.reset();


      spy.addAttributeMapping.calls.reset();


      spy.updateAttributeMapping.calls.reset();


      spy.getFilterOptions.calls.reset();


      spy.getAttributeCodes.calls.reset();


    fixture = TestBed.createComponent(ValidDonationTypeProcedureCodesComponent);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(ValidDonationTypeProcedureCodesService) as jasmine.SpyObj<ValidDonationTypeProcedureCodesService>;


    });


  /* ===============================
     INITIALIZATION
  =============================== */
  describe('Component Initialization', () => {
    it('should initialize configurations on construction', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.title).toBe('Valid Donation Type/Procedure Codes');
      expect(component.searchConfig).toBeDefined();
      expect(component.tableConfig).toBeDefined();
    });

    it('should load data on ngOnInit', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(of({ data: mockData, totalRecords: 2 }));

      fixture.detectChanges(); // triggers ngOnInit

      expect(serviceSpy.getValidDonationTypeProcedureCodes).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockData);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    });


  });

  /* ===============================
     LOAD DATA
  =============================== */
  describe('loadData', () => {


    it('should handle error when loading data fails', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();

      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load attribute mapping data. Please try again.');
    });

    it('should calculate correct skip and take values for pagination', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      expect(serviceSpy.getValidDonationTypeProcedureCodes).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    });
  });

  /* ===============================
     SEARCH
  =============================== */
  describe('onSearch', () => {
    it('should update request state and reload data on search', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(of({ data: mockData, totalRecords: 2 }));

      component.onSearch('test keyword');

      expect(component.requestState.searchKeyword).toBe('test keyword');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(serviceSpy.getValidDonationTypeProcedureCodes).toHaveBeenCalled();
    });


  });

  /* ===============================
     PAGINATION
  =============================== */
  /* ===============================
     SORTING
  =============================== */
  /* ===============================
     ROW ACTIONS
  =============================== */
  describe('onRowAction', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });
  });

  /* ===============================
     CREATE AND EDIT RECORD
  =============================== */
  describe('Record Management', () => {
    it('should open side panel for creating new record', () => {
      component.createRecord();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open side panel for editing existing record', () => {
      const record = mockData[0];

      component.editRecord(record);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(record);
    });




  });

  /* ===============================
     FILTER PANEL
  =============================== */
  describe('Filter Management', () => {






    it('should apply effective date filter with Before period', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(of({ data: mockData, totalRecords: 2 }));

      const filters: ValidDonationTypeProcedureCodesFilterValue = {
        donationType: null,
        procedureCode: null,
        attributeGroup: null,
        periodType1: 'Before',
        effectiveDate: new Date('2024-01-01'),
        periodType2: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.requestState.effectiveDateBefore).toBeDefined();
      expect(component.requestState.effectiveDateAfter).toBeUndefined();
    });

    it('should remove specific filter chip and reload data', () => {
      serviceSpy.getValidDonationTypeProcedureCodes.and.returnValue(of({ data: mockData, totalRecords: 2 }));

      component.requestState.donationType = 'WB';
      component.appliedFilters = {
        donationType: 'WB',
        procedureCode: null,
        attributeGroup: null,
        periodType1: null,
        effectiveDate: null,
        periodType2: null,
        terminationDate: null
      };

      component.removeFilterChip('donationType');

      expect(component.requestState.donationType).toBeUndefined();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(serviceSpy.getValidDonationTypeProcedureCodes).toHaveBeenCalled();
    });


  });

  /* ===============================
     DATE FORMATTING
  =============================== */
  describe('Date Formatting', () => {






    it('should format ISO date string correctly', () => {
      const formatted = component['formatDate']('2024-12-25T00:00:00Z');

      expect(formatted).toContain('25');
      expect(formatted).toContain('DEC');
      expect(formatted).toContain('2024');
    });
  });

  /* ===============================
     KEYBOARD SHORTCUTS
  =============================== */
  /* ===============================
     TABLE CONFIGURATION
  =============================== */
  describe('Table Configuration', () => {


    it('should have correct row actions', () => {
      const actions = component['getRowActions']();

      expect(actions.length).toBe(1);
      expect(actions[0].action).toBe('edit');
      expect(actions[0].icon).toBe('edit');
    });
  });

  /* ===============================
     GETTER PROPERTIES
  =============================== */
});
