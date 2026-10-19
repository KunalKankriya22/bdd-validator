import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';

import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { ApplicationSequenceNumbersComponent } from './application-sequence-numbers.component';
import { ApplicationSequenceNumbersApiService } from './services/application-sequence-numbers-api.service';
import { ApplicationSequenceNumber, ApplicationSequenceNumberFilterParams } from './interfaces/application-sequence-number.interface';
import { HeaderService } from '@shared/services/header.service';

describe('ApplicationSequenceNumbersComponent', () => {
  let component: ApplicationSequenceNumbersComponent;
  let fixture: ComponentFixture<ApplicationSequenceNumbersComponent>;
  let mockApiService: jasmine.SpyObj<ApplicationSequenceNumbersApiService>;
  let mockHeaderService: HeaderService;
  let chapterChanged$: Subject<void>;

  const mockLastResetDate = new Date(new Date().setDate(new Date().getDate() - 7)); // 7 days ago

  const mockData: ApplicationSequenceNumber[] = [
    {
      chapterId: 'IBC',
      chapterName: 'Versiti - IN DTL',
      numberType: 'GELTUBE_BOX',
      maxNumber: 2000,
      startingNumber: 310,
      resetCycle: 'D',
      lastResetDate: mockLastResetDate
    },
    {
      chapterId: 'CH01',
      chapterName: 'Chapter 01',
      numberType: 'BATCH_SEQ',
      maxNumber: 7140,
      startingNumber: 7140,
      resetCycle: 'Y',
      lastResetDate: mockLastResetDate
    },
    {
      chapterId: 'CH02',
      chapterName: 'Chapter 02',
      numberType: 'TB_SEQ',
      maxNumber: 714,
      startingNumber: null,
      resetCycle: null,
      lastResetDate: null
    }
  ];

  beforeEach(() => {

    mockApiService = jasmine.createSpyObj('ApplicationSequenceNumbersApiService', [
      'getApplicationSequenceNumbers',
      'createSequenceNumber',
      'updateSequenceNumber'
    ]);

    // Create HeaderService mock with chapter changed observable
    chapterChanged$ = new Subject<void>();
    mockHeaderService = {
      chapterChanged$: chapterChanged$.asObservable()
    } as HeaderService;



      TestBed.configureTestingModule({
      imports: [ApplicationSequenceNumbersComponent,
        NoopAnimationsModule,
        MatDialogModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ApplicationSequenceNumbersApiService, useValue: mockApiService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


    


      mockApiService.getApplicationSequenceNumbers.calls.reset();


      mockApiService.createSequenceNumber.calls.reset();


      mockApiService.updateSequenceNumber.calls.reset();


    fixture = TestBed.createComponent(ApplicationSequenceNumbersComponent);
    component = fixture.componentInstance;


    });

  describe('loadData', () => {
    it('should load data successfully with server-side pagination', () => {
      mockApiService.getApplicationSequenceNumbers.and.returnValue(
        of({ data: mockData, totalRecords: 3 })
      );

      component.loadData();

      expect(component.dataSource).toEqual(mockData);
      expect(component.tableConfig.pagination?.totalRecords).toBe(3);
      expect(component.isLoading).toBe(false);
    });





    it('should calculate correct skip and take values for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      mockApiService.getApplicationSequenceNumbers.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );

      component.loadData();

      expect(mockApiService.getApplicationSequenceNumbers).toHaveBeenCalledWith(
        25,
        50,
        jasmine.any(Object)
      );
    });
  });







  describe('onRowAction', () => {
    it('should call editRecord when action is edit', () => {
      spyOn(component, 'editRecord');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });
  });
  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockApiService.getApplicationSequenceNumbers.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
    });

    describe('applyFilters', () => {
      it('should update appliedFilters and requestState', () => {
        const filters: ApplicationSequenceNumberFilterParams = {
          chapterId: 'IBC',
          chapterName: 'Versiti - IN DTL',
          numberType: 'GELTUBE_BOX',
          cycle: 'D'
        };

        component.applyFilters(filters);

        expect(component.appliedFilters).toEqual(filters);
        expect(component.requestState.ChapterId).toBe('IBC');
        expect(component.requestState.ChapterName).toBe('Versiti - IN DTL');
        expect(component.requestState.NumberType).toBe('GELTUBE_BOX');
        expect(component.requestState.Cycle).toBe('D');
      });

      it('should generate filter chips', () => {
        const filters: ApplicationSequenceNumberFilterParams = {
          chapterId: 'IBC',
          chapterName: null,
          numberType: null,
          cycle: null
        };

        component.applyFilters(filters);

        expect(component.filterChips.length).toBeGreaterThan(0);
      });




    });

    describe('onRemoveFilterChip', () => {


      it('should update filter chips', () => {
        component.appliedFilters = {
          chapterId: 'IBC',
          chapterName: 'Versiti - IN DTL',
          numberType: null,
          cycle: null
        };

        component.onRemoveFilterChip('chapterId');

        expect(component.filterChips.length).toBeLessThan(2);
      });


    });
    describe('clearAllFilters', () => {
      beforeEach(() => {
        component.appliedFilters = {
          chapterId: 'IBC',
          chapterName: 'Versiti - IN DTL',
          numberType: 'GELTUBE_BOX',
          cycle: 'D'
        };
        component.requestState = {
          ChapterId: 'IBC',
          ChapterName: 'Versiti - IN DTL',
          NumberType: 'GELTUBE_BOX',
          Cycle: 'D'
        };
      });



      it('should remove filter params from requestState', () => {
        component.clearAllFilters();

        expect(component.requestState.ChapterId).toBeUndefined();
        expect(component.requestState.ChapterName).toBeUndefined();
        expect(component.requestState.NumberType).toBeUndefined();
        expect(component.requestState.Cycle).toBeUndefined();
      });




    });
  });

  describe('Chapter Change Behavior', () => {
    beforeEach(() => {
      mockApiService.getApplicationSequenceNumbers.and.returnValue(
        of({ data: mockData, totalRecords: mockData.length })
      );
    });

    it('should reset all UI state when chapter changes', () => {
      // Initialize component
      component.ngOnInit();

      // Set up some state
      component.appliedFilters = {
        chapterId: 'IBC',
        chapterName: 'Versiti - IN DTL',
        numberType: 'GELTUBE_BOX',
        cycle: 'D'
      };
      component.filterChips = [{ key: 'chapterId', label: 'Chapter ID: IBC', value: 'IBC' }];
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];

      // Trigger chapter change
      chapterChanged$.next();

      // Verify all state is reset
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
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

      // Verify pagination is reset
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(mockData.length);
    });




  });
});
