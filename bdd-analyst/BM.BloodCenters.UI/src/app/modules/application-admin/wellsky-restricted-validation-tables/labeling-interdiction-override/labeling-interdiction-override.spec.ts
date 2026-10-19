import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { LabelingInterdictionOverrideComponent } from './labeling-interdiction-override';
import { LabelingInterdictionOverrideService } from './services/labeling-interdiction-override.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { LabelingInterdictionOverrideModel, LabelingInterdictionOverrideFilterValue } from './models/labeling-interdiction-override.model';
import { TranslateModule } from '@ngx-translate/core';
import { getLabelingInterdictionOverridePaginatorIntl } from './labeling-interdiction-override';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';
import { createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('LabelingInterdictionOverrideComponent', () => {
  let component: LabelingInterdictionOverrideComponent;
  let fixture: ComponentFixture<LabelingInterdictionOverrideComponent>;
  let mockService: jasmine.SpyObj<LabelingInterdictionOverrideService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockData: LabelingInterdictionOverrideModel[] = [
    {
      donorDecisionCode: 'DDC001',
      donorDecisionDescription: 'Decision 1',
      productType: 'PT001',
      productTypeDescription: 'Product Type 1',
      interCode: 'IC001',
      interDescription: 'Inter Desc 1',
      interType: 'N',
      overrideDescription: 'Override 1',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    },
    {
      donorDecisionCode: 'DDC002',
      donorDecisionDescription: 'Decision 2',
      productType: 'PT002',
      productTypeDescription: 'Product Type 2',
      interCode: 'IC002',
      interDescription: 'Inter Desc 2',
      interType: 'B',
      overrideDescription: 'Override 2',
      effectiveDate: new Date('2025-02-01'),
      terminationDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    data: mockData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('LabelingInterdictionOverrideService', [
      'getLabelingInterdictionOverrides',
      'getDropdowns',
      'createOverride',
      'updateOverride'
    ]);
    mockService.getLabelingInterdictionOverrides.and.returnValue(of(mockResponse));

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

    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({
        title: 'Labeling Interdiction Override: Tech1',
        subtitle: 'Manage labeling interdiction overrides'
      }),
      writable: false
    });



      TestBed.configureTestingModule({
      imports: [
        LabelingInterdictionOverrideComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: LabelingInterdictionOverrideService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


      mockPageHeaderService.getCurrentMenuItem.calls.reset();


      mockService.getLabelingInterdictionOverrides.and.returnValue(of(mockResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(LabelingInterdictionOverrideComponent);
    component = fixture.componentInstance;


    });
  describe('loadData', () => {






    it('should calculate skip value based on pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();
      tick();

      expect(mockService.getLabelingInterdictionOverrides).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));
  });

  describe('onSearchEvent', () => {
    it('should clear SearchKeyword and reload for empty search', fakeAsync(() => {
      component.requestState.SearchKeyword = 'previous';
      component.onSearchEvent('');
      tick();

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockService.getLabelingInterdictionOverrides).toHaveBeenCalled();
    }));

    it('should clear SearchKeyword and reload for whitespace-only search', fakeAsync(() => {
      component.requestState.SearchKeyword = 'previous';
      component.onSearchEvent('   ');
      tick();

      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockService.getLabelingInterdictionOverrides).toHaveBeenCalled();
    }));






  });

  describe('onEnterSearch', () => {
    it('should set SearchKeyword and load data when text >= 3 chars', fakeAsync(() => {
      component.searchBarComponent = { searchText: 'test search' } as any;

      component.onEnterSearch();
      tick();

      expect(component.requestState.SearchKeyword).toBe('test search');
      expect(mockService.getLabelingInterdictionOverrides).toHaveBeenCalled();
    }));











    it('should trim search text and set trimmed value', fakeAsync(() => {
      component.searchBarComponent = { searchText: '  test  ' } as any;

      component.onEnterSearch();
      tick();

      expect(component.requestState.SearchKeyword).toBe('test');
    }));
  });
  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      spyOn(component, 'editRecord');
      const row = mockData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.editRecord).toHaveBeenCalledWith(row);
    });
  });

  describe('Side Panel Operations', () => {
    it('should open side panel in add mode when createRecord is called', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should open side panel in edit mode when editRecord is called', () => {
      const record = mockData[0];

      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBe(true);
    });





    it('should update mode and clear data when switching to add mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should update mode without clearing data when switching to edit mode', () => {
      component.sidePanelMode = 'add';
      component.sidePanelData = mockData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });
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




    it('should set date filters correctly', fakeAsync(() => {
      const filters: LabelingInterdictionOverrideFilterValue = {
        donorDecisionCode: null,
        interType: null,
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-06-15'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.EffectivePeriod).toBe('after');
      expect(component.requestState.EffectiveDate).toBe('2025-06-15');
      expect(component.requestState.TerminationPeriod).toBe('before');
      expect(component.requestState.TerminationDate).toBe('2025-12-31');
    }));









    it('should preserve SearchKeyword when clearing filters', fakeAsync(() => {
      component.requestState = {
        SearchKeyword: 'test',
        DonorDecisionCode: 'DDC001',
        InterType: 'N'
      };

      component.clearAllFilters();
      tick();

      expect(component.requestState.SearchKeyword).toBe('test');
      expect(component.requestState.DonorDecisionCode).toBeUndefined();
    }));
  });

  describe('Keyboard Shortcuts', () => {




    it('should close overlay on Escape when overlay is open', () => {
      component['overlayRef'] = mockOverlayRef;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.handleKeyboardShortcut(event);

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });


  });

  describe('Format Methods', () => {
    const mockRow = mockData[0];





    it('should format donorDecisionCode with description', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'donorDecisionCode');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const result = formatter('DDC001', mockData[0]);
        expect(result).toBe('DDC001 - Decision 1');
      }
    });

    it('should format donorDecisionCode without description', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'donorDecisionCode');
      const formatter = column?.valueFormatter;

      if (formatter) {
        const row: LabelingInterdictionOverrideModel = {
          donorDecisionCode: 'DDC001',
          donorDecisionDescription: ''
        };
        const result = formatter('DDC001', row);
        expect(result).toBe('DDC001');
      }
    });
  });
  describe('Header Actions', () => {
    it('should have NEW OVERRIDE action', () => {
      const action = component.headerConfig.actions?.find(a => a.label === 'ADD NEW OVERRIDE');
      expect(action).toBeDefined();
      expect(action?.icon).toBe('add');
    });


  });

  describe('updateRequestStateFromFilters', () => {
    it('should clear filter params when appliedFilters is null', () => {
      component.requestState = {
        DonorDecisionCode: 'DDC001',
        InterType: 'N',
        SearchKeyword: 'test'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.DonorDecisionCode).toBeUndefined();
      expect(component.requestState.InterType).toBeUndefined();
      expect(component.requestState.SearchKeyword).toBe('test');
    });

    it('should update request state from applied filters', () => {
      component.appliedFilters = {
        donorDecisionCode: 'DDC001',
        interType: 'N',
        effectiveDatePeriod: 'After',
        effectiveDate: moment('2025-01-01'),
        terminationDatePeriod: 'Before',
        terminationDate: moment('2025-12-31')
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.DonorDecisionCode).toBe('DDC001');
      expect(component.requestState.InterType).toBe('N');
      expect(component.requestState.EffectivePeriod).toBe('after');
      expect(component.requestState.TerminationPeriod).toBe('before');
    });
  });
});
