import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { DonProcConsentDefinitionComponent } from './don-proc-consent-definition';
import { DonProcConsentDefinitionService } from './services/don-proc-consent-definition.service';
import { DonProcConsentDefinitionModel } from './models/don-proc-consent-definition.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DonProcConsentDefinitionComponent', () => {
  let component: DonProcConsentDefinitionComponent;
  let fixture: ComponentFixture<DonProcConsentDefinitionComponent>;
  let mockService: jasmine.SpyObj<DonProcConsentDefinitionService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockData: DonProcConsentDefinitionModel[] = [
    {
      donationType: 'AL',
      procedureCode: 'DP',
      consentCode: 'DCONGEN',
      consentDescription: 'General Consent for Donation',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: new Date('2025-01-28')
    },
    {
      donationType: 'AL',
      procedureCode: 'WB',
      consentCode: 'DCONTST',
      consentDescription: 'Donor Consent',
      effectiveDate: new Date('2025-01-11'),
      terminationDate: new Date('2025-01-14')
    }
  ];

  const pageHeaderDataSignal = signal({
    title: 'Consent Mapping',
    subtitle: 'Manage consent mappings'
  });

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonProcConsentDefinitionService', [
      'getConsentDefinitions'
    ]);

    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: pageHeaderDataSignal
    });

      TestBed.configureTestingModule({
      imports: [
        DonProcConsentDefinitionComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DonProcConsentDefinitionService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        },
        Overlay
      ]
    });
    mockService.getConsentDefinitions.and.returnValue(
      of({ data: mockData, totalRecords: 2 })
    );

    fixture = TestBed.createComponent(DonProcConsentDefinitionComponent);
    component = fixture.componentInstance;

    });

  describe('Component Initialization', () => {

    it('should initialize with correct configurations', () => {
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Consent Mapping');
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      expect(component.tableConfig.pagination).toBeDefined();
    });

    it('should not set subtitle in headerConfig so it falls back to page header service', () => {
      expect(component.headerConfig.subtitle).toBeUndefined();
    });

    it('should initialize pagination with page size of 10', () => {
      fixture.detectChanges();

      expect(component.tableConfig.pagination?.pageSize).toBe(10);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
    });

  });

  describe('Data Loading', () => {
    it('should handle successful data load', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.dataSource).toEqual(mockData);
        expect(component.tableConfig.pagination?.totalRecords).toBe(2);
        expect(component.isLoading).toBe(false);
        expect(component.hasError).toBe(false);
        done();
      });
    });

    it('should handle data load error', (done) => {
      mockService.getConsentDefinitions.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.isLoading).toBe(false);
        expect(component.errorMessage).toBeTruthy();
        done();
      }, 100);
    });
  });

  describe('Search Functionality', () => {
    it('should update requestState on search', () => {
      fixture.detectChanges();

      component.onSearch('test search');

      expect(component.requestState.SearchKeyword).toBe('test search');
      expect(mockService.getConsentDefinitions).toHaveBeenCalled();
    });

  });
});
