import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { LabelingInterdictionOverrideQueryComponent } from './labeling-interdiction-override-query';
import { LabelingInterdictionOverrideQueryService } from './services/labeling-interdiction-override-query.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import {
  LabelingInterdictionOverrideQueryModel,
  LabelingInterdictionOverrideFilterValue
} from './models/labeling-interdiction-override-query.model';
import { TranslateModule } from '@ngx-translate/core';

describe('LabelingInterdictionOverrideQueryComponent', () => {
  let component: LabelingInterdictionOverrideQueryComponent;
  let fixture: ComponentFixture<LabelingInterdictionOverrideQueryComponent>;
  let mockService: jasmine.SpyObj<LabelingInterdictionOverrideQueryService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;

  const mockData: LabelingInterdictionOverrideQueryModel[] = [
    {
      donorDecisionCode: 'DDC001',
      productType: 'PT001',
      interCode: 'IC001',
      interDesc: 'Inter Description 1',
      interType: 'TypeA',
      overrideDesc: 'Override Desc 1',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      donorDecisionCode: 'DDC002',
      productType: 'PT002',
      interCode: 'IC002',
      interDesc: 'Inter Description 2',
      interType: 'TypeB',
      overrideDesc: 'Override Desc 2',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    data: mockData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabelingInterdictionOverrideQueryService', [
      'getLabelingInterdictionOverrideQuery',
      'getLabelingInterdictionOverrideQueryFilters'
    ]);
    mockService.getLabelingInterdictionOverrideQuery.and.returnValue(of(mockResponse));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);



      TestBed.configureTestingModule({
      imports: [
        LabelingInterdictionOverrideQueryComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: LabelingInterdictionOverrideQueryService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockService.getLabelingInterdictionOverrideQuery.and.returnValue(of(mockResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(LabelingInterdictionOverrideQueryComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {














    it('should initialize with empty filterChips', () => {
      expect(component.filterChips).toEqual([]);
    });






  });

  describe('loadData', () => {






    it('should calculate skip value based on pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();
      tick();

      expect(mockService.getLabelingInterdictionOverrideQuery).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));

  });

  describe('onSearch', () => {
    it('should clear requestState SearchKeyword when search is empty', fakeAsync(() => {
      component.requestState.SearchKeyword = 'previous search';
      component.onSearch('');
      tick();

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockService.getLabelingInterdictionOverrideQuery).toHaveBeenCalled();
    }));



    it('should not trigger search for non-empty text (only clears on empty)', fakeAsync(() => {
      component.onSearch('test search');
      tick();

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockService.getLabelingInterdictionOverrideQuery).not.toHaveBeenCalled();
    }));
  });
  describe('openFilter', () => {
    it('should dispose existing overlay and close filter when overlayRef exists', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should create overlay and set isFilterOpen to true when overlayRef does not exist', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;
      component['tableCard'] = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      expect(component.isFilterOpen).toBe(true);
    });
  });

  describe('Filter Operations', () => {


    it('should set EffectiveDatePeriod and EffectiveDate in requestState when applying filters', fakeAsync(() => {
      const effDate = new Date('2025-06-15');
      const filters: LabelingInterdictionOverrideFilterValue = {
        cue: null,
        type: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.EffectivePeriod).toBe('before');
      expect(component.requestState.EffectiveDate).toBeDefined();
    }));












  });

  describe('Keyboard Shortcuts', () => {




    it('should close overlay on Escape when overlay is open', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcut(event);

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });


  });

  describe('Format Methods (Date Formatting)', () => {
    const mockRow = mockData[0];

    it('should format effDate correctly', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'effDate');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter(new Date('2025-01-15'), mockRow);
        expect(result).toMatch(/15-JAN-2025/);
      }
    });



    it('should format termDate correctly', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'termDate');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter(new Date('2025-12-31'), mockRow);
        expect(result).toMatch(/31-DEC-2025/);
      }
    });




  });

  describe('ngOnDestroy', () => {




    it('should not throw when overlayRef is null', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
  describe('updateRequestStateFromFilters (private)', () => {
    it('should clear filter params when appliedFilters is null', () => {
      component.requestState = {
        DonorDecisionCode: 'DDC001',
        InterType: 'TypeA',
        SearchKeyword: 'test'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.DonorDecisionCode).toBeUndefined();
      expect(component.requestState.InterType).toBeUndefined();
      expect(component.requestState.SearchKeyword).toBe('test');
    });

    it('should update request state from applied filters', () => {
      const effDate = new Date('2025-06-15');
      component.appliedFilters = {
        cue: 'DDC001',
        type: 'TypeA',
        effectiveDatePeriod: 'After',
        effectiveDate: effDate,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.DonorDecisionCode).toBe('DDC001');
      expect(component.requestState.InterType).toBe('TypeA');
      expect(component.requestState.EffectivePeriod).toBe('after');
      expect(component.requestState.EffectiveDate).toBeDefined();
    });
  });
});
