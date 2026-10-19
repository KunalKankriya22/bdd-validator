import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddFunctionsComponent } from './add-functions';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddFunctionsService } from './services/add-functions.service';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

describe('AddFunctionsComponent', () => {
  let defaultDialogRef: any;
  let component: AddFunctionsComponent;
  let fixture: ComponentFixture<AddFunctionsComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockAddFunctionsService: jasmine.SpyObj<AddFunctionsService>;

  const mockFiltersResponse = {
    functionTypes: ['PAGE', 'MENU'],
    functionScopes: ['Scheduling', 'InventoryManagement', 'LabResults']
  };

  const mockFunctionsResponse = {
    success: true,
    message: 'Successfully fetched add functions',
    statusCode: 200,
    data: [
      {
        fcnId: '1234',
        fcnIcon: 'language',
        fcnUrl: 'api/test',
        execName: 'TEST',
        fcnType: 'PAGE',
        fcnScope: 'Scheduling',
        p1Name: 'PARAM1',
        p2Name: 'PARAM2',
        p3Name: 'PARAM3',
        remarks: 'Test function'
      }
    ],
    total: 1
  };

  beforeEach(() => {

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    // Create a default dialog ref that will be used unless overridden in tests
    defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultDialogRef.afterClosed.and.returnValue(of(null));

    // Create MatDialog mock with proper internal state
    const openSpy = jasmine.createSpy('open').and.returnValue(defaultDialogRef);
    mockDialog = {
      open: openSpy,
      openDialogs: [],
      afterOpened: of(),
      afterAllClosed: of(),
      _openDialogsAtThisLevel: [],
      _afterAllClosedAtThisLevel: of(),
      _afterOpenedAtThisLevel: of(),
      _ariaHiddenElements: new Map(),
      closeAll: jasmine.createSpy('closeAll'),
      getDialogById: jasmine.createSpy('getDialogById')
    } as any;

    mockAddFunctionsService = jasmine.createSpyObj('AddFunctionsService', [
      'getFilters',
      'getAddFunctions',
      'createAddFunction',
      'updateAddFunction',
      'deleteAddFunction'
    ]);

    mockAddFunctionsService.getFilters.and.returnValue(of(mockFiltersResponse));
    mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));



      TestBed.configureTestingModule({
      imports: [
        AddFunctionsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AddFunctionsService, useValue: mockAddFunctionsService }
      ]
    });


    


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      defaultDialogRef.afterClosed.calls.reset();


      mockAddFunctionsService.getFilters.calls.reset();


      mockAddFunctionsService.getAddFunctions.calls.reset();


      mockAddFunctionsService.createAddFunction.calls.reset();


      mockAddFunctionsService.updateAddFunction.calls.reset();


      mockAddFunctionsService.deleteAddFunction.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      defaultDialogRef.afterClosed.and.returnValue(of(null));


      mockAddFunctionsService.getFilters.and.returnValue(of(mockFiltersResponse));


      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));


    fixture = TestBed.createComponent(AddFunctionsComponent);
    component = fixture.componentInstance;

    // Manually override the injected dialog instance
    (component as any).dialog = mockDialog;

    fixture.detectChanges();


    });
  describe('loadFunctions', () => {
    it('should load functions successfully', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));

      component.loadFunctions();
      tick();

      expect(component.isLoading).toBe(false);
      expect(component.dataSource).toEqual(mockFunctionsResponse.data);
      expect(component.tableConfig.pagination?.totalRecords).toBe(mockFunctionsResponse.total);
    }));



    it('should pass correct pagination parameters', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadFunctions();
      tick();

      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalledWith(50, 25, {});
    }));

    it('should pass filter parameters when filters are applied', fakeAsync(() => {
      component.searchTerm = 'test';
      component.appliedFilters = { functionType: 'PAGE', scope: 'Scheduling' };

      component.loadFunctions();
      tick();

      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalledWith(
        0,
        25,
        { searchKeyword: 'test', functionType: 'PAGE', scope: 'Scheduling' }
      );
    }));

    it('should handle unsuccessful response', fakeAsync(() => {
      spyOn(console, 'error');
      const errorResponse = { ...mockFunctionsResponse, success: false, message: 'Error' };
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(errorResponse));

      component.loadFunctions();
      tick();

      expect(console.error).toHaveBeenCalledWith('Failed to fetch add functions:', 'Error');
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    }));


  });

  describe('Search Functionality', () => {
    it('should reload functions on search', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));
      component.searchTerm = 'test query';

      component.onSearch();
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    }));
  });

  describe('Filter Functionality', () => {
    it('should apply filters and reload functions', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));
      const filters = { functionType: 'PAGE', scope: 'Scheduling' };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    }));

    it('should clear all filters and reload functions', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));
      component.appliedFilters = { functionType: 'PAGE', scope: 'Scheduling' };

      component.onClearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    }));



    it('should check if filters are active', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);

      component.appliedFilters = { functionType: 'PAGE', scope: null };
      expect(component.hasActiveFilters()).toBe(true);

      component.appliedFilters = { functionType: null, scope: 'Scheduling' };
      expect(component.hasActiveFilters()).toBe(true);

      component.appliedFilters = { functionType: 'PAGE', scope: 'Scheduling' };
      expect(component.hasActiveFilters()).toBe(true);
    });
  });
  describe('Action Methods', () => {
    it('should handle add new function', fakeAsync(() => {
      component.onAddNew();
      tick();

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        width: '660px',
        disableClose: true
      }));
    }));

    it('should handle edit function', fakeAsync(() => {
      const mockFunction = mockFunctionsResponse.data[0];

      component.onEdit(mockFunction);
      tick();

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        width: '660px',
        disableClose: true,
        data: jasmine.objectContaining({
          mode: 'edit',
          data: mockFunction
        })
      }));
    }));


  });

  describe('Sort Functionality', () => {
    it('should handle sort changes', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));
      const event = { column: 'execName', direction: 'A' as const };

      component.onSortChange(event);
      tick();

      expect(component.tableConfig.sortConfig?.column).toBe('execName');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    }));

    it('should apply filters using applyFilters method', fakeAsync(() => {
      mockAddFunctionsService.getAddFunctions.and.returnValue(of(mockFunctionsResponse));
      const filters = { functionType: 'PAGE', scope: 'Scheduling' };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(mockAddFunctionsService.getAddFunctions).toHaveBeenCalled();
    }));
  });
});
