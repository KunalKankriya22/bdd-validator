import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssociateLetterToInterdiction } from './associate-letter-to-interdiction';
import { AssociateLetterToInterdictionService } from './services/associate-letter-to-interdiction.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AssociateLetterToInterdictionModel, AssociateLetterToInterdictionFilterValue } from './models/associate-letter-to-interdiction.model';
import { TablePageEvent, TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

describe('AssociateLetterToInterdiction', () => {
  let serviceSpy: any;
  let component: AssociateLetterToInterdiction;
  let fixture: ComponentFixture<AssociateLetterToInterdiction>;
  let service: jasmine.SpyObj<AssociateLetterToInterdictionService>;

  const mockData: AssociateLetterToInterdictionModel[] = [
    {
      interCode: 'D01',
      interDesc: 'Deferred - Travel',
      donationType: 'WB',
      donationDesc: 'Whole Blood',
      letterId: 'LTR001',
      effDate: '2025-01-01T00:00:00',
      termDate: null,
      insertDate: '2025-01-01T12:00:00',
      insertUser: 'admin'
    },
    {
      interCode: 'D02',
      interDesc: 'Deferred - Medical',
      donationType: 'PLT',
      donationDesc: 'Platelets',
      letterId: 'LTR002',
      effDate: '2025-02-01T00:00:00',
      termDate: '2025-12-31T00:00:00',
      insertDate: '2025-02-01T12:00:00',
      insertUser: 'admin'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AssociateLetterToInterdictionService', [
      'search',
      'create',
      'update',
      'getInterdictionsDropdown',
      'getDonationTypesDropdown',
      'getLettersDropdown',
      'getFilterInterdictionsDropdown',
      'getFilterDonationTypesDropdown',
      'getFilterLettersDropdown'
    ]);



      TestBed.configureTestingModule({
imports: [AssociateLetterToInterdiction, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: AssociateLetterToInterdictionService, useValue: serviceSpy },
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


    });



  beforeEach(() => {


      serviceSpy.search.calls.reset();


      serviceSpy.create.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.getInterdictionsDropdown.calls.reset();


      serviceSpy.getDonationTypesDropdown.calls.reset();


      serviceSpy.getLettersDropdown.calls.reset();


      serviceSpy.getFilterInterdictionsDropdown.calls.reset();


      serviceSpy.getFilterDonationTypesDropdown.calls.reset();


      serviceSpy.getFilterLettersDropdown.calls.reset();


    service = TestBed.inject(AssociateLetterToInterdictionService) as jasmine.SpyObj<AssociateLetterToInterdictionService>;
    service.search.and.returnValue(of({ data: mockData, totalRecords: 2 }));

    fixture = TestBed.createComponent(AssociateLetterToInterdiction);
    component = fixture.componentInstance;


    });
  describe('Data Loading', () => {

    it('should handle error when loading data fails', (done) => {
      service.search.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.loadData();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(component.hasError).toBe(true);
        expect(component.dataSource).toEqual([]);
        done();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update request state with search text', () => {
      component.onSearch('D01');
      expect(component.requestState.searchKeyword).toBe('D01');
      expect(service.search).toHaveBeenCalled();
    });


  });
  describe('Sorting', () => {
    it('should handle ascending sort', () => {
      component.onSortChange({ column: 'interCode', direction: 'A' });
      expect(component.requestState.sortOrder).toBe('ASC');
      expect(service.search).toHaveBeenCalled();
    });

    it('should handle descending sort', () => {
      component.onSortChange({ column: 'donationType', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
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

    it('should generate filter chips when applying filters', () => {
      const filters: AssociateLetterToInterdictionFilterValue = {
        interCode: 'D01',
        donationType: 'WB',
        letterId: null
      };
      component.applyFilters(filters);
      expect(component.filterChips.length).toBe(2);
    });
  });

  describe('Clear All Filters', () => {
    it('should clear all filters and preserve search', () => {
      component.requestState = {
        searchKeyword: 'test',
        interCode: 'D01',
        donationType: 'WB'
      };

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.requestState.searchKeyword).toBe('test');
      expect(service.search).toHaveBeenCalled();
    });
  });
});
