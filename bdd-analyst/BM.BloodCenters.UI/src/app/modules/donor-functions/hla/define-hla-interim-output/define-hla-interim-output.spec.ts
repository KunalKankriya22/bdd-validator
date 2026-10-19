import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { DefineHlaInterimOutput } from './define-hla-interim-output';
import { HlaInterimOutputService } from './services/hla-interim-output.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatSnackBar, createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineHlaInterimOutput', () => {
  let pageHeaderServiceSpy: any;
  let headerServiceSpy: any;
  let serviceSpy: any;
  let component: DefineHlaInterimOutput;
  let fixture: ComponentFixture<DefineHlaInterimOutput>;
  let service: jasmine.SpyObj<HlaInterimOutputService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockFilterValues = {
    matchA1A1: [
      { match: '01', description: 'HLA-A*01' },
      { match: '02', description: 'HLA-A*02' }
    ],
    matchA1A2: [
      { match: '01', description: 'HLA-A*01' },
      { match: '02', description: 'HLA-A*02' }
    ],
    matchA2A1: [
      { match: '03', description: 'HLA-B*03' },
      { match: '07', description: 'HLA-B*07' }
    ],
    matchA2A2: [
      { match: '03', description: 'HLA-B*03' },
      { match: '07', description: 'HLA-B*07' }
    ],
    outputA1: [
      { match: '01', description: 'HLA-A*01' },
      { match: '02', description: 'HLA-A*02' }
    ],
    outputA2: [
      { match: '01', description: 'HLA-A*01' },
      { match: '02', description: 'HLA-A*02' }
    ]
  };

  const mockInterimCodes = [
    { interimCode: '01', interimDescription: 'HLA-A*01' },
    { interimCode: '02', interimDescription: 'HLA-A*02' }
  ];

  const mockHlaData = [
    {
      hlaCode: '01-02-03-07',
      hlaDescription: '01-02-03-07',
      matchA1A1: '01',
      matchA1A2: '02',
      matchA2A1: '03',
      matchA2A2: '07',
      outcomeAntigenA1: '01',
      outcomeAntigenA2: '02',
      effectiveDate: '2024-01-01',
      terminationDate: null,
      insUser: 'testuser',
      insDate: '2024-01-01',
      updUser: 'testuser',
      updDate: '2024-01-01'
    }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('HlaInterimOutputService', [
      'getAll',
      'getFilterValues',
      'getInterimCodesLov'
    ]);
    const snackBarSpy = createMockMatSnackBar();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.getTitle.and.returnValue('Test Title');

    serviceSpy.getAll.and.returnValue(of({ data: mockHlaData, total: 1 }));
    serviceSpy.getFilterValues.and.returnValue(of(mockFilterValues));
    serviceSpy.getInterimCodesLov.and.returnValue(of(mockInterimCodes));



      TestBed.configureTestingModule({
      imports: [
        DefineHlaInterimOutput,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HlaInterimOutputService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
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
      pageHeaderServiceSpy.getTitle.and.returnValue('Test Title');


      serviceSpy.getAll.and.returnValue(of({ data: mockHlaData, total: 1 }));


      serviceSpy.getFilterValues.and.returnValue(of(mockFilterValues));


      serviceSpy.getInterimCodesLov.and.returnValue(of(mockInterimCodes));


    service = TestBed.inject(HlaInterimOutputService) as jasmine.SpyObj<HlaInterimOutputService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;

    fixture = TestBed.createComponent(DefineHlaInterimOutput);
    component = fixture.componentInstance;


    });


  it('should initialize with default configuration', () => {
    expect(component.tableConfig.pagination?.pageSize).toBe(25);
    expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    expect(component.dataSource).toEqual([]);
  });



  it('should handle search text', () => {
    fixture.detectChanges();

    component.onSearch('test');

    expect(component.requestState.searchText).toBe('test');
    expect(service.getAll).toHaveBeenCalled();
  });

  it('should handle pagination changes', () => {
    fixture.detectChanges();

    const pageEvent = { pageSize: 50, pageIndex: 1, previousPageIndex: 0 };
    component.onPageChange(pageEvent);

    expect(component.tableConfig.pagination?.pageSize).toBe(50);
    expect(component.tableConfig.pagination?.pageIndex).toBe(1);
    expect(service.getAll).toHaveBeenCalled();
  });

  it('should handle sorting', () => {
    fixture.detectChanges();

    const sortEvent = { column: 'matchA1A1', direction: 'A' as const };
    component.onSortChange(sortEvent);

    expect(component.tableConfig.sortConfig?.column).toBe('matchA1A1');
    expect(component.tableConfig.sortConfig?.direction).toBe('A');
    expect(service.getAll).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    fixture.detectChanges();

    const filters = { matchA1A1: '01', matchA1A2: '02' };
    component.applyFilters(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.filterChips.length).toBeGreaterThan(0);
    expect(service.getAll).toHaveBeenCalled();
  });







  it('should cleanup on destroy', () => {
    fixture.detectChanges();

    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
