import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { CryoResultsComponent } from './cryo-results';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
import { PageHeaderService } from '../../../../../shared/services/page-header.service';
import { HeaderService } from '../../../../../shared/services/header.service';
import { CryoResultsService } from './services/cryo-results.service';
import { CryoResultUnit, WorksheetIdItem } from './models/cryo-results.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('CryoResultsComponent', () => {
  let component: CryoResultsComponent;
  let fixture: ComponentFixture<CryoResultsComponent>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockService: jasmine.SpyObj<CryoResultsService>;
  let chapterChangedSubject: Subject<void>;

  const mockWorksheetItems: WorksheetIdItem[] = [
    { worksheetId: 'CY1001' },
    { worksheetId: 'CY1002' },
  ];

  const mockUnits: CryoResultUnit[] = [
    {
      unitId: 'W633317070115-H',
      collDate: '1-MAR-2025, 09:00',
      actualProductCode: 'E0701V00',
      productShortName: 'CRYO',
      thawMethod: 'REF',
      thawTemperature: '3.0',
      sepInd: '3',
      freezeTime: '1-MAR-2025, 09:00',
    },
    {
      unitId: 'W633317070116-H',
      collDate: '2-MAR-2025, 10:00',
      actualProductCode: 'E0701V01',
      productShortName: 'CRYO',
      thawMethod: 'REF',
      thawTemperature: '3.0',
      sepInd: '3',
      freezeTime: '2-MAR-2025, 10:00',
    },
  ];

  const mockResponse = { data: mockUnits, totalRecords: 2 };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockSnackbarService = createMockSnackbarService();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(undefined),
    });

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject });

    mockService = jasmine.createSpyObj('CryoResultsService', [
      'getWorksheetIds',
      'getUnitsAwaitingResults',
    ]);

    mockService.getWorksheetIds.and.returnValue(of(mockWorksheetItems));
    mockService.getUnitsAwaitingResults.and.returnValue(of(mockResponse));



      TestBed.configureTestingModule({
      imports: [
        CryoResultsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: CryoResultsService, useValue: mockService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });

      mockService.getWorksheetIds.and.returnValue(of(mockWorksheetItems));


      mockService.getUnitsAwaitingResults.and.returnValue(of(mockResponse));


    fixture = TestBed.createComponent(CryoResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load worksheet IDs on init', () => {
    expect(mockService.getWorksheetIds).toHaveBeenCalled();
    expect(component['worksheetLovItems']().length).toBe(2);
    expect(component['filteredWorksheetLovItems']().length).toBe(2);
  });



  it('should mark field as touched when retrieving without worksheet ID', () => {
    component['worksheetIdControl'].setValue('');
    component['onRetrieveWorksheet']();
    expect(component['worksheetIdControl'].touched).toBe(true);
  });

  it('should load units when worksheet is selected', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(mockService.getUnitsAwaitingResults).toHaveBeenCalledWith('CY1001', 25, 0, 'unitId', null);
    expect(component.dataSource.length).toBe(2);
    expect(component['hasRetrieved']()).toBe(true);
  });

  it('should update Unit ID header with count after loading units', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(component.tableConfig.columns[0].header).toBe('Unit ID (2)');
  });

  it('should set totalRecords from server response', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(component.tableConfig.pagination!.totalRecords).toBe(2);
  });

  it('should handle API error when loading units', () => {
    const error = { status: 500, error: { message: 'Server error' } };
    mockService.getUnitsAwaitingResults.and.returnValue(throwError(() => error));

    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Server error');
    expect(component.dataSource).toEqual([]);
  });

  it('should clear worksheet and reset form on clear', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    component['onClearWorksheet']();

    expect(component['worksheetIdControl'].value).toBeNull();
    expect(component['worksheetSearchControl'].value).toBeNull();
    expect(component.dataSource).toEqual([]);
    expect(component['hasRetrieved']()).toBe(false);
  });





  it('should call loadUnits on page change', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();
    component['onPageChange']({ pageIndex: 1, pageSize: 10, previousPageIndex: 0 });

    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
    expect(mockService.getUnitsAwaitingResults).toHaveBeenCalledWith('CY1001', 10, 10, 'unitId', null);
  });

  it('should pass correct skip on page 2 with pageSize 25', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();
    component['onPageChange']({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });

    expect(mockService.getUnitsAwaitingResults).toHaveBeenCalledWith('CY1001', 25, 25, 'unitId', null);
  });

  it('should reset page index when selecting a new worksheet', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();
    component['onPageChange']({ pageIndex: 2, pageSize: 10, previousPageIndex: 1 });
    component['onRetrieveWorksheet']();

    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(mockService.getUnitsAwaitingResults).toHaveBeenCalledWith('CY1001', 10, 0, 'unitId', null);
  });







  it('should clear data on chapter change', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    chapterChangedSubject.next();

    expect(component['worksheetIdControl'].value).toBeNull();
    expect(component.dataSource).toEqual([]);
    expect(component['hasRetrieved']()).toBe(false);
  });

  it('should have correct table column configuration', () => {
    const columns = component.tableConfig.columns;
    expect(columns.length).toBe(8);
    expect(columns[0].key).toBe('unitId');
    expect(columns[1].key).toBe('collDate');
    expect(columns[2].key).toBe('actualProductCode');
    expect(columns[3].key).toBe('productShortName');
    expect(columns[4].key).toBe('thawMethod');
    expect(columns[5].key).toBe('thawTemperature');
    expect(columns[6].key).toBe('sepInd');
    expect(columns[7].key).toBe('freezeTime');
  });







  it('should handle error without message gracefully', () => {
    const error = { status: 500, error: {} };
    mockService.getUnitsAwaitingResults.and.returnValue(throwError(() => error));

    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to retrieve units');
  });





  it('should show all worksheets when search text is empty', fakeAsync(() => {
    component['worksheetSearchControl'].setValue('');
    tick(300);

    expect(component['filteredWorksheetLovItems']().length).toBe(2);
  }));



  it('should return empty array when no worksheets match search', fakeAsync(() => {
    component['worksheetSearchControl'].setValue('NONEXISTENT');
    tick(300);

    expect(component['filteredWorksheetLovItems']().length).toBe(0);
  }));

  it('should filter worksheets matching search text', fakeAsync(() => {
    component['worksheetSearchControl'].setValue('CY1001');
    tick(300);

    expect(component['filteredWorksheetLovItems']().length).toBe(1);
    expect(component['filteredWorksheetLovItems']()[0].worksheetId).toBe('CY1001');
  }));

  it('should update header config when pageHeaderData emits', () => {
    (mockPageHeaderService.pageHeaderData as any).set({
      title: 'CRYO Results',
      subtitle: 'Query screen',
    });
    fixture.detectChanges();

    expect(component.headerConfig.title).toBe('CRYO Results');
    expect(component.headerConfig.subtitle).toBe('Query screen');
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
  });

  it('should set empty subtitle when pageHeaderData has no subtitle', () => {
    (mockPageHeaderService.pageHeaderData as any).set({
      title: 'CRYO Results',
    });
    fixture.detectChanges();

    expect(component.headerConfig.subtitle).toBe('');
  });

  it('should not show snackbar on 404 error when loading worksheets', () => {
    mockService.getWorksheetIds.and.returnValue(throwError(() => ({ status: 404 })));

    component['loadWorksheetIds']();

    expect(mockSnackbarService.showError).not.toHaveBeenCalled();
  });

  it('should not show snackbar on 401 error when loading worksheets', () => {
    mockService.getWorksheetIds.and.returnValue(throwError(() => ({ status: 401 })));

    component['loadWorksheetIds']();

    expect(mockSnackbarService.showError).not.toHaveBeenCalled();
  });

  it('should show snackbar on 500 error when loading worksheets', () => {
    mockService.getWorksheetIds.and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Internal error' } })),
    );

    component['loadWorksheetIds']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Internal error');
  });

  it('should show default message when worksheet error has no message', () => {
    mockService.getWorksheetIds.and.returnValue(
      throwError(() => ({ status: 500 })),
    );

    component['loadWorksheetIds']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load worksheet IDs');
  });

  it('should use errorResponse.Error when error.message is missing', () => {
    const error = { status: 500, error: { errorResponse: { Error: 'Validation failed' } } };
    mockService.getUnitsAwaitingResults.and.returnValue(throwError(() => error));

    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Validation failed');
  });

  it('should update sort config and reload on sort change', () => {
    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();
    mockService.getUnitsAwaitingResults.calls.reset();

    component['onSortChange']({ column: 'unitId', direction: 'asc' });

    expect(component.tableConfig.sortConfig!.column).toBe('unitId');
    expect(component.tableConfig.sortConfig!.direction).toBe('asc');
    expect(mockService.getUnitsAwaitingResults).toHaveBeenCalledWith('CY1001', 25, 0, 'unitId', 'asc');
  });

  it('should show plain Unit ID header when totalRecords is 0', () => {
    mockService.getUnitsAwaitingResults.and.returnValue(of({ data: [], totalRecords: 0 }));

    component['worksheetIdControl'].setValue('CY1001');
    component['onRetrieveWorksheet']();

    expect(component.tableConfig.columns[0].header).toBe('Unit ID');
  });

  it('should not call service when loadUnits is invoked without worksheetId', () => {
    mockService.getUnitsAwaitingResults.calls.reset();
    component['worksheetIdControl'].setValue('');

    component.loadUnits();

    expect(mockService.getUnitsAwaitingResults).not.toHaveBeenCalled();
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    const spy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
