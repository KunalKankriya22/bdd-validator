import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { DonorInterdictionOverrideQueryComponent } from './donor-interdiction-override-query.component';
import { ValidDonorOverrideApiService, LookupDto } from './services/valid-donor-override-api.service';
import { DonorInterdictionOverrideQueryModel, DonorInterdictionOverrideFilterValue } from './models/donor-interdiction-override-query.model';
import { LoggingService } from '@shared/services/logging.service';

describe('DonorInterdictionOverrideQueryComponent', () => {
  let component: DonorInterdictionOverrideQueryComponent;
  let fixture: ComponentFixture<DonorInterdictionOverrideQueryComponent>;
  let mockService: jasmine.SpyObj<ValidDonorOverrideApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockData: DonorInterdictionOverrideQueryModel[] = [
    {
      donorDecisionCode: 'A',
      decisionDesc: 'Accept',
      productType: 'WB',
      productTypeDesc: 'Whole Blood',
      attribGroup: 'GRP001',
      attribCode: 'ATTR001',
      interCode: 'INT01',
      interDesc: 'Interdiction 01',
      interType: 'H',
      overrideDesc: 'Hold Override',
      effDate: new Date('2025-01-01'),
      termDate: null
    },
    {
      donorDecisionCode: 'R',
      decisionDesc: 'Reject',
      productType: 'PLT',
      productTypeDesc: 'Platelets',
      attribGroup: 'GRP002',
      attribCode: 'ATTR002',
      interCode: 'INT02',
      interDesc: 'Interdiction 02',
      interType: 'N',
      overrideDesc: 'None Override',
      effDate: new Date('2025-02-01'),
      termDate: new Date('2025-12-31')
    }
  ];

  const mockCueOptions: LookupDto[] = [
    { code: 'A', description: 'Accept' },
    { code: 'R', description: 'Reject' }
  ];

  const mockTypeOptions: LookupDto[] = [
    { code: 'H', description: 'Hold' },
    { code: 'N', description: 'None' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ValidDonorOverrideApiService', [
      'getValidDonorOverrides',
      'getLookupCue',
      'getLookupType'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    mockService.getValidDonorOverrides.and.returnValue(of({ data: mockData, total: 2 }));
    mockService.getLookupCue.and.returnValue(of(mockCueOptions));
    mockService.getLookupType.and.returnValue(of(mockTypeOptions));



      TestBed.configureTestingModule({
imports: [
        DonorInterdictionOverrideQueryComponent,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ValidDonorOverrideApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        Overlay,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    });



  beforeEach(() => {


      mockService.getValidDonorOverrides.calls.reset();


      mockService.getLookupCue.calls.reset();


      mockService.getLookupType.calls.reset();


      mockLoggingService.log.calls.reset();


      mockLoggingService.error.calls.reset();


      mockLoggingService.warn.calls.reset();


      mockLoggingService.debug.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockService.getValidDonorOverrides.and.returnValue(of({ data: mockData, total: 2 }));


      mockService.getLookupCue.and.returnValue(of(mockCueOptions));


      mockService.getLookupType.and.returnValue(of(mockTypeOptions));


    fixture = TestBed.createComponent(DonorInterdictionOverrideQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('ngOnInit', () => {



    it('should set typeOptions after loading', fakeAsync(() => {
      tick();
      // typeOptions are loaded from the service
      expect(component.typeOptions.length).toBe(2);
      expect(component.typeOptions[0].code).toBe('H');
      expect(component.typeOptions[1].code).toBe('N');
    }));
  });

  describe('loadData', () => {



    it('should set hasError to true on error', fakeAsync(() => {
      mockService.getValidDonorOverrides.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should log error using LoggingService on error', fakeAsync(() => {
      const error = new Error('API Error');
      mockService.getValidDonorOverrides.and.returnValue(throwError(() => error));

      component.loadData();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Error loading donor interdiction override query data',
        error
      );
    }));

    it('should set error message on error', fakeAsync(() => {
      mockService.getValidDonorOverrides.and.returnValue(throwError(() => new Error('API Error')));

      component.loadData();
      tick();

      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
    }));
  });
  describe('applyFilters', () => {
    it('should set appliedFilters', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
    });




    it('should generate filter chips', () => {
      const filters: DonorInterdictionOverrideFilterValue = {
        cue: 'A',
        type: 'H',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(2);
    });
  });
  describe('clearAllFilters', () => {


    it('should clear filter-related requestState properties', () => {
      component.requestState = {
        DonorDecisionCode: 'A',
        InterType: 'H',
        SearchKeyword: 'test'
      };

      component.clearAllFilters();

      expect(component.requestState.DonorDecisionCode).toBeUndefined();
      expect(component.requestState.InterType).toBeUndefined();
      expect(component.requestState.SearchKeyword).toBe('test'); // Should preserve non-filter properties
    });


  });
  describe('searchConfig', () => {
    it('should have correct placeholder', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Interdiction or Description');
    });

    it('should have minimum length of 3', () => {
      expect(component.searchConfig.minLength).toBe(3);
    });
  });
});
