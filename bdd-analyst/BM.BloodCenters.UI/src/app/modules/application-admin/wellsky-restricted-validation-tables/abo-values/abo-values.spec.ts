import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { of, Subject, throwError } from 'rxjs';
import { AboValuesComponent } from './abo-values';
import { AboValuesService } from './services/abo-values.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { TranslateService } from '@ngx-translate/core';
import { AboValuesModel, AboValuesFilterValue } from './models/abo-values.model';
import { createMockTranslateService, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AboValuesComponent', () => {
  let pageHeaderServiceSpy: any;
  let aboValuesServiceSpy: any;
  let component: AboValuesComponent;
  let fixture: ComponentFixture<AboValuesComponent>;
  let aboValuesService: jasmine.SpyObj<AboValuesService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let chapterChangedSubject: Subject<any>;

  const mockDataResponse = {
    success: true,
    data: [
      {
        testedAbo: 'A+',
        description: 'A Positive',
        intendedUse: 'Transfusion',
        unitScheme: 'Component',
        aboLabel: 'A',
        aboDescription: 'Type A',
        bloodTypeCode: 'A',
        transfusionStatus: 'Eligible',
        aboOnly: 'Y',
        alternateAbo: '',
        usageCode: 'U1',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null
      } as AboValuesModel
    ],
    totalRecords: 1
  };

  const mockFilterOptionsResponse = {
    success: true,
    data: [
      {
        intendedUse: [
          { key: 'D', value: 'Donor' },
          { key: 'P', value: 'Patient' },
          { key: 'T', value: 'Transfusion' }
        ],
        unitScheme: [
          { key: 'C', value: 'Component' },
          { key: 'W', value: 'Whole Blood' }
        ],
        transfusionStatus: [
          { key: 'E', value: 'Eligible' },
          { key: 'I', value: 'Ineligible' }
        ]
      }
    ]
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject();

    aboValuesServiceSpy = jasmine.createSpyObj('AboValuesService', [
      'getAboValues',
      'getAboValuesFilters'
    ]);
    pageHeaderServiceSpy = createMockPageHeaderService();
    const headerServiceSpy = createMockHeaderService();
    const translateServiceSpy = createMockTranslateService();

    aboValuesServiceSpy.getAboValues.and.returnValue(of(mockDataResponse));
    aboValuesServiceSpy.getAboValuesFilters.and.returnValue(of(mockFilterOptionsResponse));
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Test Subtitle');



      TestBed.configureTestingModule({
      imports: [
        AboValuesComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AboValuesService, useValue: aboValuesServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        Overlay
      ]
    });


    


      aboValuesServiceSpy.getAboValues.calls.reset();


      aboValuesServiceSpy.getAboValuesFilters.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.pageHeaderData.calls.reset();


      aboValuesServiceSpy.getAboValues.and.returnValue(of(mockDataResponse));


      aboValuesServiceSpy.getAboValuesFilters.and.returnValue(of(mockFilterOptionsResponse));


      pageHeaderServiceSpy.getSubtitle.and.returnValue('Test Subtitle');


    aboValuesService = TestBed.inject(AboValuesService) as jasmine.SpyObj<AboValuesService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    fixture = TestBed.createComponent(AboValuesComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {




    it('should handle error when loading filter options fails', fakeAsync(() => {
      aboValuesService.getAboValuesFilters.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      tick();

      // Should not crash, filter options should be empty
      expect(component.intendedUseOptions).toEqual([]);
      expect(component.unitSchemeOptions).toEqual([]);
      expect(component.transfusionStatusOptions).toEqual([]);
    }));


  });
  describe('Filter Chips', () => {
    it('should convert filters to chips', () => {
      fixture.detectChanges(); // Load filter options first

      component.appliedFilters = {
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(component.appliedFilters);

      expect(component.filterChips.length).toBe(2);
    });




  });
  describe('loadData', () => {


    it('should handle error when loading data fails', fakeAsync(() => {
      fixture.detectChanges();
      aboValuesService.getAboValues.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load ABO values data. Please try again.');
    }));

    it('should calculate skip and take correctly', fakeAsync(() => {
      fixture.detectChanges();
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 2;
        component.tableConfig.pagination.pageSize = 10;
      }

      component.loadData();
      tick();

      expect(aboValuesService.getAboValues).toHaveBeenCalledWith(
        10,
        20,
        jasmine.any(Object)
      );
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear search and reload data when empty', () => {
      component.requestState.searchKeyword = 'test';
      spyOn(component, 'loadData');

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should trim search text', () => {
      component.onSearch('  test  ');

      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should trigger search on Enter with valid length', () => {
      component.searchBarComponent = { searchText: 'AB+' } as any;
      spyOn(component, 'loadData');

      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBe('AB+');
      expect(component.loadData).toHaveBeenCalled();
    });




  });



  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should handle descending sort', () => {
      spyOn(component, 'loadData');

      component.onSortChange({ column: 'description', direction: 'D' });

      expect(component.requestState.sort).toBe('D');
    });


  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should open edit panel with record data', () => {
      const record = mockDataResponse.data[0];

      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(record);
      expect(component.sidePanelOpen).toBeTrue();
    });
  });

  describe('Create Record', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should create record via header action', () => {
      const createAction = component.headerConfig.actions?.find(a => a.label === 'ADD NEW ABO RULE');
      expect(createAction).toBeDefined();

      spyOn(component, 'createRecord');
      createAction?.onClick();

      expect(component.createRecord).toHaveBeenCalled();
    });
  });

  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should handle mode change to add', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockDataResponse.data[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should handle mode change to edit', () => {
      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
    });
  });

  describe('Filter Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle filter panel closed if already open', () => {
      const overlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = overlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(overlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
      expect(component['overlayRef']).toBeNull();
    });
  });

  describe('Apply Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should convert filter keys to values for API', () => {
      const filters: AboValuesFilterValue = {
        intendedUse: 'D',
        unitScheme: 'W',
        transfusionStatus: 'I',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      spyOn(component, 'loadData');

      component.applyFilters(filters);

      // Verify conversion
      expect(component.requestState.intendedUse).toBe('Donor');
      expect(component.requestState.unitScheme).toBe('Whole Blood');
      expect(component.requestState.transfusionStatus).toBe('Ineligible');
    });
  });

  describe('Format Functions', () => {
    it('should format boolean values', () => {
      expect(component['formatBoolean'](true)).toBe('Yes');
      expect(component['formatBoolean'](false)).toBe('No');
      expect(component['formatBoolean']('Y')).toBe('Yes');
      expect(component['formatBoolean']('N')).toBe('No');
      expect(component['formatBoolean']('yes')).toBe('Yes');
      expect(component['formatBoolean']('no')).toBe('No');
      expect(component['formatBoolean']('true')).toBe('Yes');
      expect(component['formatBoolean']('false')).toBe('No');
      expect(component['formatBoolean'](undefined)).toBe('-');
      expect(component['formatBoolean'](null as any)).toBe('-');
    });

    it('should format dates', () => {
      const date = new Date('2024-01-15');
      const formatted = component['formatDate'](date);

      expect(formatted).toContain('15');
      expect(formatted).toContain('JAN');
      expect(formatted).toContain('2024');
    });


  });



  describe('Table Configuration', () => {




    it('should format aboOnly column values', () => {
      fixture.detectChanges();

      const aboOnlyColumn = component.tableConfig.columns?.find(c => c.key === 'aboOnly');
      expect(aboOnlyColumn).toBeDefined();
      expect(aboOnlyColumn?.valueFormatter).toBeDefined();

      if (aboOnlyColumn?.valueFormatter) {
        const mockRow = {} as AboValuesModel;
        expect(aboOnlyColumn.valueFormatter('Y', mockRow)).toBe('Yes');
        expect(aboOnlyColumn.valueFormatter('N', mockRow)).toBe('No');
      }
    });

    it('should format date column values', () => {
      fixture.detectChanges();

      const effectiveDateColumn = component.tableConfig.columns?.find(c => c.key === 'effectiveDate');
      expect(effectiveDateColumn).toBeDefined();
      expect(effectiveDateColumn?.valueFormatter).toBeDefined();

      if (effectiveDateColumn?.valueFormatter) {
        const mockRow = {} as AboValuesModel;
        const result = effectiveDateColumn.valueFormatter(new Date('2024-01-15'), mockRow);
        expect(result).toContain('15');
        expect(result).toContain('JAN');
      }
    });
  });

  describe('Additional Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle search with only whitespace', () => {
      spyOn(component, 'loadData');

      component.onSearch('   ');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should not update search bar if trimmed text matches', () => {
      component.searchBarComponent = { searchText: 'test' } as any;

      component.onSearch('test');

      expect(component.searchBarComponent.searchText).toBe('test');
    });

    it('should handle Enter search with whitespace-only input', () => {
      component.searchBarComponent = { searchText: '   ' } as any;
      spyOn(component, 'loadData');

      component.onEnterSearch();

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle removing filter chip that leaves other filters', () => {
      fixture.detectChanges(); // Load filter options

      component.appliedFilters = {
        intendedUse: 'T',
        unitScheme: 'C',
        transfusionStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      spyOn(component, 'loadData');

      component.onRemoveFilterChip('intendedUse');

      expect(component.appliedFilters?.intendedUse).toBeNull();
      expect(component.appliedFilters?.unitScheme).toBe('C');
      expect(component.loadData).toHaveBeenCalled();
    });



    it('should format various boolean string values', () => {
      expect(component['formatBoolean']('TRUE')).toBe('Yes');
      expect(component['formatBoolean']('FALSE')).toBe('No');
      expect(component['formatBoolean']('YES')).toBe('Yes');
      expect(component['formatBoolean']('NO')).toBe('No');
      expect(component['formatBoolean']('random')).toBe('random');
    });




  });
});
