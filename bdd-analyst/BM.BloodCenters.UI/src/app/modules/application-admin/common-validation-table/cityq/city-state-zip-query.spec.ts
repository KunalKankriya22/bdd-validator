import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { CityStateZipQueryComponent } from './city-state-zip-query';
import { CityStateZipQueryService } from './services/city-state-zip-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Overlay } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { NewZipCodeDialog } from '@shared/components/new-zip-code/new-zip-code';
import { createMockMatDialog } from '@shared/testing/common-mocks';

describe('CityStateZipQueryComponent', () => {
  let component: CityStateZipQueryComponent;
  let fixture: ComponentFixture<CityStateZipQueryComponent>;
  let serviceSpy: jasmine.SpyObj<CityStateZipQueryService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockData = [
    {
      uspsId: 1,
      city: 'Dallas',
      state: 'TX',
      zip: '75235',
      county: 'Dallas',
      commonlyUsedFlag: 'Y',
      effectiveDate: '02-Jun-2026',
      programId: 'TEST',
      insertDate: '2024-01-01',
      insertUser: 'SYSTEM'
    }
  ];

  const mockSaveResult = {
    action: 'save' as const,
    zipCode: {
      uspsId: 1,
      state: 'TX',
      city: 'Dallas',
      zip: '75235',
      county: 'Dallas',
      effectiveDate: '02-Jun-2026',
      terminationDate: null,
      commonlyUsedFlag: 'Y'
    }
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('CityStateZipQueryService', [
      'query',
      'getById',
      'create',
      'update',
      'getStates',
      'getCities',
      'getCounties'
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null)
    });
    dialogSpy = createMockMatDialog();

    serviceSpy.query.and.returnValue(of({ data: mockData, totalRecords: 1 }));



      TestBed.configureTestingModule({
      imports: [CityStateZipQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: CityStateZipQueryService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        Overlay,
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });


    


      serviceSpy.query.calls.reset();


      serviceSpy.getById.calls.reset();


      serviceSpy.create.calls.reset();


      serviceSpy.update.calls.reset();


      serviceSpy.getStates.calls.reset();


      serviceSpy.getCities.calls.reset();


      serviceSpy.getCounties.calls.reset();


      serviceSpy.query.and.returnValue(of({ data: mockData, totalRecords: 1 }));


    fixture = TestBed.createComponent(CityStateZipQueryComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.sortConfig?.column).toBe('');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });




  });
  describe('Search', () => {
    it('should clear search keyword when search text is empty', () => {
      fixture.detectChanges();

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(serviceSpy.query).toHaveBeenCalled();
    });

    it('should set search keyword on search', () => {
      fixture.detectChanges();

      component.onSearch('Dallas');

      expect(component.requestState.searchKeyword).toBe('Dallas');
      expect(serviceSpy.query).toHaveBeenCalled();
    });

    it('should trim whitespace from search keyword', () => {
      fixture.detectChanges();

      component.onSearch('  Dallas  ');

      expect(component.requestState.searchKeyword).toBe('Dallas');
    });


  });

  describe('Filters', () => {
    it('should apply filters correctly', () => {
      fixture.detectChanges();
      const filters = {
        city: 'Dallas',
        state: 'TX',
        zip: null,
        county: null
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.city).toBe('Dallas');
      expect(component.requestState.state).toBe('TX');
      expect(serviceSpy.query).toHaveBeenCalled();
    });






  });

  describe('Row Actions', () => {




    it('should not reload data when edit dialog is closed without saving', (done) => {
      fixture.detectChanges();
      const queryCallCount = serviceSpy.query.calls.count();
      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of({ action: 'close' })
      } as any);

      component.onRowAction({ action: 'edit', row: mockData[0] });

      setTimeout(() => {
        expect(serviceSpy.query.calls.count()).toBe(queryCallCount);
        done();
      }, 100);
    });
  });

  describe('Dialog Operations', () => {




    it('should not reload data when add dialog is closed without saving', (done) => {
      fixture.detectChanges();
      const queryCallCount = serviceSpy.query.calls.count();
      spyOn((component as any).dialog, 'open').and.returnValue({
        afterClosed: () => of({ action: 'close' })
      } as any);

      component.openAddDialog();

      setTimeout(() => {
        expect(serviceSpy.query.calls.count()).toBe(queryCallCount);
        done();
      }, 100);
    });


  });
});
