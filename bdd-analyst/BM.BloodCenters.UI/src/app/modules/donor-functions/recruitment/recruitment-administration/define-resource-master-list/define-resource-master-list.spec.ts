import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefineResourceMasterListComponent } from './define-resource-master-list';
import { DefineResourceMasterListService } from './services/define-resource-master-list.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DefineResourceMasterListModel, DefineResourceMasterListFilterValue } from './models/define-resource-master-list.model';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

describe('DefineResourceMasterListComponent', () => {
  let serviceSpy: any;
  let component: DefineResourceMasterListComponent;
  let fixture: ComponentFixture<DefineResourceMasterListComponent>;
  let service: jasmine.SpyObj<DefineResourceMasterListService>;

  const mockData: DefineResourceMasterListModel[] = [
    {
      resourceCode: 'STAFF',
      resourceDesc: 'Staff Resource',
      resourceType: 'STAFF',
      sortSeq: 1,
      criticalInd: 'Y',
      effDate: '2024-01-01T00:00:00.000Z',
      termDate: null
    },
    {
      resourceCode: 'COACH',
      resourceDesc: 'Coach Resource',
      resourceType: 'COACH',
      sortSeq: 2,
      criticalInd: 'N',
      effDate: '2024-01-01T00:00:00.000Z',
      termDate: '2024-12-31T00:00:00.000Z'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('DefineResourceMasterListService', [
      'getDefineResourceMasterList',
      'addResourceCode',
      'updateResourceCode',
      'getFilterOptions'
    ]);



      TestBed.configureTestingModule({
      imports: [DefineResourceMasterListComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: DefineResourceMasterListService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      serviceSpy.getDefineResourceMasterList.calls.reset();


      serviceSpy.addResourceCode.calls.reset();


      serviceSpy.updateResourceCode.calls.reset();


      serviceSpy.getFilterOptions.calls.reset();


    service = TestBed.inject(DefineResourceMasterListService) as jasmine.SpyObj<DefineResourceMasterListService>;
    service.getDefineResourceMasterList.and.returnValue(of({ data: mockData, totalRecords: 2 }));

    fixture = TestBed.createComponent(DefineResourceMasterListComponent);
    component = fixture.componentInstance;


    });

  describe('Data Loading', () => {


    it('should handle error when loading data fails', (done) => {
      service.getDefineResourceMasterList.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.loadData();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(component.hasError).toBe(true);
        expect(component.errorMessage).toBe('Failed to load resource master list data. Please try again.');
        done();
      });
    });

    it('should calculate correct skip and take for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();

      expect(service.getDefineResourceMasterList).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
    });
  });

  describe('Search Functionality', () => {
    it('should update request state with search text', () => {
      component.onSearch('STAFF');

      expect(component.requestState.searchText).toBe('STAFF');
      expect(service.getDefineResourceMasterList).toHaveBeenCalled();
    });




  });
  describe('Side Panel', () => {
    it('should open side panel for creating new record', () => {
      component.createRecord();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open side panel for editing record', () => {
      component.editRecord(mockData[0]);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });




  });
  describe('Filter Application', () => {




    it('should apply date filters with period types', () => {
      const effDate = new Date('2024-01-01');
      const termDate = new Date('2024-12-31');
      const filters: DefineResourceMasterListFilterValue = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: null,
        showTermination: null,
        effectiveDate: effDate,
        terminationDate: termDate,
        periodType1: 'On or After',
        periodType2: 'On or Before'
      };

      component.applyFilters(filters);

      expect(component.requestState.effDate).toBeDefined();
      expect(component.requestState.effDatePeriod).toBe('On or After');
      expect(component.requestState.termDate).toBeDefined();
      expect(component.requestState.termDatePeriod).toBe('On or Before');
    });


  });

  describe('Filter Chip Removal', () => {
    it('should remove critical filter chip', () => {
      component.requestState.criticalInd = 'Y';
      component.appliedFilters = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: 'Yes',
        showTermination: null,
        effectiveDate: null,
        terminationDate: null,
        periodType1: null,
        periodType2: null
      };

      component.removeFilterChip('critical');

      expect(component.requestState.criticalInd).toBeUndefined();
      expect(service.getDefineResourceMasterList).toHaveBeenCalled();
    });



    it('should remove effectiveDate filter chip and period', () => {
      component.requestState.effDate = '2024-01-01';
      component.requestState.effDatePeriod = 'On or After';

      component.removeFilterChip('effectiveDate');

      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.effDatePeriod).toBeUndefined();
    });

    it('should remove terminationDate filter chip and period', () => {
      component.requestState.termDate = '2024-12-31';
      component.requestState.termDatePeriod = 'On or Before';

      component.removeFilterChip('terminationDate');

      expect(component.requestState.termDate).toBeUndefined();
      expect(component.requestState.termDatePeriod).toBeUndefined();
    });


  });

  describe('Clear All Filters', () => {
    it('should clear all filters and request state', () => {
      component.appliedFilters = {
        resourceCode: null,
        type: null,
        sequence: null,
        critical: 'Yes',
        showTermination: 'Yes',
        effectiveDate: new Date(),
        terminationDate: new Date(),
        periodType1: 'On or After',
        periodType2: 'On or Before'
      };
      component.requestState = {
        criticalInd: 'Y',
        showTerminated: 'Y',
        effDate: '2024-01-01',
        effDatePeriod: 'On or After',
        termDate: '2024-12-31',
        termDatePeriod: 'On or Before'
      };

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.criticalInd).toBeUndefined();
      expect(component.requestState.showTerminated).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
      expect(service.getDefineResourceMasterList).toHaveBeenCalled();
    });


  });
  describe('Formatters', () => {
    it('should format Yes/No values correctly', () => {
      const columns = component['getTableColumns']();
      const criticalColumn = columns.find(col => col.key === 'criticalInd');

      expect(criticalColumn?.valueFormatter?.('Y', mockData[0])).toBe('Yes');
      expect(criticalColumn?.valueFormatter?.('N', mockData[0])).toBe('No');
      expect(criticalColumn?.valueFormatter?.(undefined, mockData[0])).toBe('-');
    });




  });
});
