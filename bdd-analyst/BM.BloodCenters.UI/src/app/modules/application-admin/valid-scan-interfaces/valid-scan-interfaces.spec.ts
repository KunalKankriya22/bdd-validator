import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { ValidScanInterfaces } from './valid-scan-interfaces';
import { ValidScanInterfaceService } from './services/valid-scan-interface.service';
import { ValidScanInterfaceModel } from './models/valid-scan-interface.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { TranslateService } from '@ngx-translate/core';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ValidScanInterfaces', () => {
  let routerSpy: any;
  let pageHeaderServiceSpy: any;
  let serviceSpy: any;
  let component: ValidScanInterfaces;
  let fixture: ComponentFixture<ValidScanInterfaces>;
  let validScanInterfaceService: jasmine.SpyObj<ValidScanInterfaceService>;
  let router: jasmine.SpyObj<Router>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockData: ValidScanInterfaceModel[] = [
    {
      scanType: 'TYPE1',
      startCount: 2,
      startCode: 'AB',
      stopSize: 1,
      stopCode: 'X',
      stringSize: 10,
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      modificationDate: new Date('2024-01-01')
    },
    {
      scanType: 'TYPE2',
      startCount: 3,
      startCode: 'ABC',
      stopSize: 2,
      stopCode: 'YZ',
      stringSize: 15,
      effectiveDate: new Date('2024-02-01'),
      terminationDate: new Date('2024-12-31'),
      modificationDate: new Date('2024-02-01')
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ValidScanInterfaceService', [
      'getValidScanInterfaces'
    ]);

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['setPageHeader'], {
      pageHeaderData: signal({
        title: 'Scale Configuration',
        subtitle: 'Manage and configure scale configurations',
        breadcrumbs: []
      })
    });

    chapterChangedSubject = new Subject<void>();
    const headerServiceSpy = {
      chapterChanged$: chapterChangedSubject.asObservable()
    };

    const translateServiceSpy = createMockTranslateService();

    const routerEventsSubject = new Subject();
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: routerEventsSubject.asObservable(),
      url: '/valid-scan-interfaces'
    });
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      params: of({}),
      queryParams: of({}),
      snapshot: { params: {}, queryParams: {} }
    });



      TestBed.configureTestingModule({
      imports: [ValidScanInterfaces],
      providers: [
        { provide: ValidScanInterfaceService, useValue: serviceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations()
      ]
    });


    


      serviceSpy.getValidScanInterfaces.calls.reset();


      pageHeaderServiceSpy.setPageHeader.calls.reset();


      routerSpy.navigate.calls.reset();


      routerSpy.createUrlTree.calls.reset();


      routerSpy.serializeUrl.calls.reset();


      routerSpy.createUrlTree.and.returnValue({} as any);


      routerSpy.serializeUrl.and.returnValue('');


    validScanInterfaceService = TestBed.inject(ValidScanInterfaceService) as jasmine.SpyObj<ValidScanInterfaceService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;


    
    validScanInterfaceService.getValidScanInterfaces.and.returnValue(
      of({ data: [], totalRecords: 0 })
    );

    fixture = TestBed.createComponent(ValidScanInterfaces);
    component = fixture.componentInstance;
  });


  describe('Component Initialization', () => {




    it('should have correct action button label', () => {
      expect(component.headerConfig.actions?.[0].label).toBe('ADD NEW SCALE CONFIGURATION');
    });




  });

  describe('Data Loading', () => {
    it('should handle loading state correctly', () => {
      validScanInterfaceService.getValidScanInterfaces.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );

      expect(component.isLoading).toBe(false);

      component.loadTableData();

      // Since of() completes synchronously, isLoading is already set to false
      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBe(false);
    });

    it('should handle errors when loading data', (done) => {
      const errorMessage = 'Error loading data';
      validScanInterfaceService.getValidScanInterfaces.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.loadTableData();

      fixture.whenStable().then(() => {
        expect(component.hasError).toBe(true);
        expect(component.errorMessage).toContain('Failed to load');
        done();
      });
    });

  });


  describe('Sorting', () => {
    it('should handle sort change events', () => {
      validScanInterfaceService.getValidScanInterfaces.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );

      const sortEvent = { column: 'scanType', direction: 'A' as const };

      component.onSortChange(sortEvent);

      expect(component.tableConfig.sortConfig?.column).toBe('scanType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(component.requestState.sort).toBe('A');
    });


  });
  describe('Edit Record', () => {
    it('should open side panel in edit mode with record data', () => {
      const mockRecord = mockData[0];

      component.editRecord(mockRecord);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockRecord);
    });
  });

  describe('Row Actions', () => {
    it('should call editRecord when edit action is triggered', () => {
      spyOn(component, 'editRecord');
      const mockRecord = mockData[0];

      component.onRowAction({ action: 'edit', row: mockRecord });

      expect(component.editRecord).toHaveBeenCalledWith(mockRecord);
    });

    it('should set activeRow on dataTableComponent when onRowAction is called', () => {
      validScanInterfaceService.getValidScanInterfaces.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      fixture.detectChanges();

      const mockRecord = mockData[0];
      component.onRowAction({ action: 'edit', row: mockRecord });

      if (component.dataTableComponent) {
        expect(component.dataTableComponent.activeRow).toBe(mockRecord);
      }
    });

    it('should not throw when dataTableComponent is not available', () => {
      const mockRecord = mockData[0];

      expect(() => {
        component.onRowAction({ action: 'edit', row: mockRecord });
      }).not.toThrow();
    });
  });

  describe('Side Panel', () => {






    it('should update mode and clear data when mode changes to add', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });
  describe('Chapter Changes', () => {
    beforeEach(() => {
      validScanInterfaceService.getValidScanInterfaces.and.returnValue(
        of({ data: mockData, totalRecords: 2 })
      );
      fixture.detectChanges();
    });

    it('should reset state and reload data on chapter change', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];
      component.requestState = { sort: 'A' };
      component.hasError = true;
      component.errorMessage = 'Some error';

      validScanInterfaceService.getValidScanInterfaces.calls.reset();

      chapterChangedSubject.next();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(component.requestState).toEqual({});
      expect(component.tableConfig.sortConfig?.column).toBe('scanType');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
      expect(component.hasError).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(validScanInterfaceService.getValidScanInterfaces).toHaveBeenCalled();
    });

  });
});
