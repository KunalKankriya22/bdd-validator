import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { ValidProductSubstitutionComponent } from './valid-product-substitution';
import { ValidProductSubstitutionService } from './services/valid-product-substitution.service';
import {
  ValidProductSubstitutionModel,
  ValidProductSubstitutionFilterValue
} from './models/valid-product-substitution.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderService } from '@shared/services/header.service';

describe('ValidProductSubstitutionComponent', () => {
  let component: ValidProductSubstitutionComponent;
  let fixture: ComponentFixture<ValidProductSubstitutionComponent>;
  let mockValidProductSubstitutionService: jasmine.SpyObj<ValidProductSubstitutionService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockHeaderService: HeaderService;
  let chapterChanged$: Subject<void>;

  // Relative dates for testing
  const today = moment().startOf('day').toDate();
  const yesterday = moment().subtract(1, 'days').startOf('day').toDate();
  const lastWeek = moment().subtract(7, 'days').startOf('day').toDate();
  const lastMonth = moment().subtract(1, 'months').startOf('day').toDate();
  const threeMonthsAgo = moment().subtract(3, 'months').startOf('day').toDate();

  const mockTableData: ValidProductSubstitutionModel[] = [
    {
      requestProductType: 'WRBC',
      requestProductTypeDescription: 'Washed Red Blood Cells',
      compatibleProductType: 'LRBC',
      compatibleProductTypeDescription: 'LeukoReduced RBC',
      effectiveDate: threeMonthsAgo,
      terminationDate: null,
      modificationDate: threeMonthsAgo
    },
    {
      requestProductType: 'LRBC',
      requestProductTypeDescription: 'LeukoReduced RBC',
      compatibleProductType: 'RBC',
      compatibleProductTypeDescription: 'Red Blood Cells',
      effectiveDate: lastMonth,
      terminationDate: lastWeek,
      modificationDate: lastWeek
    }
  ];

  beforeEach(() => {

    mockValidProductSubstitutionService = jasmine.createSpyObj('ValidProductSubstitutionService', [
      'getValidProductSubstitution',
      'getValidProductSubstitutionFilters',
      'getInventoryProductTypes',
      'addValidProductSubstitution',
      'updateValidProductSubstitution'
    ]);

    // Create TranslateService mock
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get', 'use'], {
      currentLang: 'en',
      defaultLang: 'en'
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    // Create HeaderService mock with chapter changed observable
    chapterChanged$ = new Subject<void>();
    mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable()
    } as HeaderService;



      TestBed.configureTestingModule({
      imports: [
        ValidProductSubstitutionComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatButtonModule,
        MatIconModule,
        OverlayModule
      ],
      providers: [
        { provide: ValidProductSubstitutionService, useValue: mockValidProductSubstitutionService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: HeaderService, useValue: mockHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {}, data: {} },
            params: of({}),
            queryParams: of({})
          }
        },
        Overlay
      ]
    });


    


      mockValidProductSubstitutionService.getValidProductSubstitution.calls.reset();


      mockValidProductSubstitutionService.getValidProductSubstitutionFilters.calls.reset();


      mockValidProductSubstitutionService.getInventoryProductTypes.calls.reset();


      mockValidProductSubstitutionService.addValidProductSubstitution.calls.reset();


      mockValidProductSubstitutionService.updateValidProductSubstitution.calls.reset();


      mockTranslateService.instant.calls.reset();


      mockTranslateService.get.calls.reset();


      mockTranslateService.use.calls.reset();


      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


    fixture = TestBed.createComponent(ValidProductSubstitutionComponent);
    component = fixture.componentInstance;


    });

  describe('loadData', () => {






    it('should calculate correct skip and take values for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      mockValidProductSubstitutionService.getValidProductSubstitution.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.loadData();

      expect(mockValidProductSubstitutionService.getValidProductSubstitution).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    });
  });







  describe('onRowAction', () => {
    it('should call editRecord when action is edit', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockTableData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockTableData[0]);
    });
  });
  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getValidProductSubstitution.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    describe('applyFilters', () => {
      it('should update appliedFilters and requestState', () => {
        const testEffectiveDate = moment().subtract(30, 'days').startOf('day').toDate();
        const filters: ValidProductSubstitutionFilterValue = {
          requestProductType: 'WRBC',
          compatibleProductType: 'LRBC',
          effectiveDatePeriod: 'After',
          effectiveDate: testEffectiveDate,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyFilters(filters);

        expect(component.appliedFilters).toEqual(filters);
        expect(component.requestState.RequestProductType).toBe('WRBC');
        expect(component.requestState.CompatibleProductType).toBe('LRBC');
        expect(component.requestState.EffectiveDatePeriod).toBe('After');
        expect(component.requestState.EffectiveDate).toBe(moment(testEffectiveDate).format('YYYY-MM-DD'));
      });

      it('should serialize dates to YYYY-MM-DD strings in requestState', () => {
        const testEffectiveDate = moment().subtract(60, 'days').startOf('day').toDate();
        const testTerminationDate = moment().add(30, 'days').startOf('day').toDate();
        const filters: ValidProductSubstitutionFilterValue = {
          requestProductType: null,
          compatibleProductType: null,
          effectiveDatePeriod: 'After',
          effectiveDate: testEffectiveDate,
          terminationDatePeriod: 'Before',
          terminationDate: testTerminationDate
        };

        component.applyFilters(filters);

        expect(component.requestState.EffectiveDate).toBe(moment(testEffectiveDate).format('YYYY-MM-DD'));
        expect(component.requestState.TerminationDate).toBe(moment(testTerminationDate).format('YYYY-MM-DD'));
        expect(typeof component.requestState.EffectiveDate).toBe('string');
        expect(typeof component.requestState.TerminationDate).toBe('string');
      });

      it('should generate filter chips', () => {
        const filters: ValidProductSubstitutionFilterValue = {
          requestProductType: 'WRBC',
          compatibleProductType: null,
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.applyFilters(filters);

        expect(component.filterChips.length).toBeGreaterThan(0);
      });




    });

    describe('onRemoveFilterChip', () => {


      it('should update filter chips', () => {
        component.appliedFilters = {
          requestProductType: 'WRBC',
          compatibleProductType: 'LRBC',
          effectiveDatePeriod: null,
          effectiveDate: null,
          terminationDatePeriod: null,
          terminationDate: null
        };

        component.onRemoveFilterChip('requestProductType');

        expect(component.filterChips.length).toBeLessThan(2);
      });


    });
    describe('clearAllFilters', () => {
      beforeEach(() => {
        const testEffectiveDate = moment().subtract(45, 'days').startOf('day').toDate();
        component.appliedFilters = {
          requestProductType: 'WRBC',
          compatibleProductType: 'LRBC',
          effectiveDatePeriod: 'After',
          effectiveDate: testEffectiveDate,
          terminationDatePeriod: null,
          terminationDate: null
        };
        component.requestState = {
          RequestProductType: 'WRBC',
          CompatibleProductType: 'LRBC',
          EffectiveDatePeriod: 'After',
          EffectiveDate: moment(testEffectiveDate).format('YYYY-MM-DD')
        };
      });



      it('should remove filter params from requestState', () => {
        component.clearAllFilters();

        expect(component.requestState.RequestProductType).toBeUndefined();
        expect(component.requestState.CompatibleProductType).toBeUndefined();
        expect(component.requestState.EffectiveDatePeriod).toBeUndefined();
        expect(component.requestState.EffectiveDate).toBeUndefined();
      });




    });
  });
  describe('Table Configuration', () => {
    it('should have correct column configuration', () => {
      const columns = component['getTableColumns']();

      expect(columns.length).toBe(7);
      expect(columns[0].key).toBe('requestProductType');
      expect(columns[1].key).toBe('requestProductTypeDescription');
      expect(columns[2].key).toBe('compatibleProductType');
      expect(columns[3].key).toBe('compatibleProductTypeDescription');
      expect(columns[4].key).toBe('effectiveDate');
      expect(columns[5].key).toBe('terminationDate');
      expect(columns[6].key).toBe('modificationDate');
    });






  });

  describe('Chapter Change Behavior', () => {
    beforeEach(() => {
      mockValidProductSubstitutionService.getValidProductSubstitution.and.returnValue(
        of({ data: mockTableData, totalRecords: mockTableData.length })
      );
    });

    it('should reset all UI state when chapter changes', () => {
      // Initialize component
      component.ngOnInit();

      // Set up some state
      component.searchText = 'test search';
      component.appliedFilters = {
        requestProductType: 'RBC',
        compatibleProductType: 'PLT',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'requestProductType', label: 'Request Product Type: RBC', value: 'RBC' }];
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockTableData[0];

      // Trigger chapter change
      chapterChanged$.next();

      // Verify all state is reset
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should close filter overlay when chapter changes', () => {
      component.ngOnInit();

      // Simulate filter overlay being open
      component.isFilterOpen = true;
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;

      // Trigger chapter change
      chapterChanged$.next();

      // Verify overlay is closed
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
      expect(component['overlayRef']).toBeNull();
    });





    it('should reset pagination when chapter changes', () => {
      component.ngOnInit();

      // Set pagination to page 2
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 1;
        component.tableConfig.pagination.totalRecords = 50;
      }

      // Trigger chapter change
      chapterChanged$.next();

      // Verify pagination is reset to page 0 (totalRecords will be updated by loadData)
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(mockTableData.length);
    });




  });
});
