import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewInstitution, ChapterModel } from './view-institution';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ViewInstitutionService } from '../service/view-institution.service';
import { InstitutionService } from '../service/institution.service';
import { ViewInstitution as ViewInstitutionModel } from '../interfaces/view-institution.interface';
import { DomSanitizer } from '@angular/platform-browser';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

describe('ViewInstitution Component', () => {
  let component: ViewInstitution;
  let fixture: ComponentFixture<ViewInstitution>;
  let router: Router;
  let viewInstitutionServiceSpy: jasmine.SpyObj<ViewInstitutionService>;
  let institutionServiceSpy: jasmine.SpyObj<InstitutionService>;
  let sanitizerSpy: jasmine.SpyObj<DomSanitizer>;

  // Helper function to get a past date (90 days ago)
  const getPastDate = (daysAgo: number = 90): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  };

  // Helper function to get a recent date (1 day ago)
  const getRecentDate = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString();
  };

  // Helper function to get a future date (90 days from now)
  const getFutureDate = (daysFromNow: number = 90): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
  };

  // -----------------------------
  // MOCK DATA
  // -----------------------------
  const mockInstitutions: ViewInstitutionModel[] = [
    {
      insT_ID: 'INS001',
      insT_NAME: 'Test Institution',
      insT_SHORT_NAME: 'TI',
      addresS_ID: 1,
      prinT_HDR: 'Header',
      systeM_NAME: 'System',
      codabaR_UNIT_SCHEME: 'Scheme',
      taX_ID: 'TAX123',
      reG_NO: 'REG001',
      liC_NO: 'LIC001',
      contracT_PREFIX: 'CP',
      prograM_ID: 'PRG01',
      audiT_KEY: 100,
      efF_DATE: getPastDate(90),
      lasT_MODIFIED_DATE: getRecentDate(),
      addR_1: 'Street 1',
      city: 'City',
      statE_CODE: 'ST',
      zip: '12345',
      country: 'Country',
      phonE_NUMBER: '1234567890',
      inT_FLAG: 'Y',
    },
  ];

  const mockChapters: ChapterModel[] = [
    {
      chapterId: 'B02',
      chapterName: 'Chapter B',
      effDate: getPastDate(60),
      termDate: getFutureDate(90),
    },
    {
      chapterId: 'A01',
      chapterName: 'Chapter A',
      effDate: getPastDate(30),
      termDate: getFutureDate(90),
    },
    {
      chapterId: 'C03',
      chapterName: 'Chapter C',
      effDate: getPastDate(15),
      termDate: getFutureDate(90),
    },
  ];

  beforeEach(() => {

    viewInstitutionServiceSpy = jasmine.createSpyObj('ViewInstitutionService', [
      'getInstitutions',
      'getChapters',
    ]);

    institutionServiceSpy = jasmine.createSpyObj('InstitutionService', [
      'downloadLogo'
    ]);

    sanitizerSpy = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustUrl']);

    viewInstitutionServiceSpy.getInstitutions.and.returnValue(of(mockInstitutions));
    viewInstitutionServiceSpy.getChapters.and.returnValue(of(mockChapters));

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    institutionServiceSpy.downloadLogo.and.returnValue(of(mockBlob));
    sanitizerSpy.bypassSecurityTrustUrl.and.callFake((url: string) => url as any);

      TestBed.configureTestingModule({
      imports: [ViewInstitution
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ViewInstitutionService, useValue: viewInstitutionServiceSpy },
        { provide: InstitutionService, useValue: institutionServiceSpy },
        { provide: DomSanitizer, useValue: sanitizerSpy },
        Overlay
      ],
    });

    

      viewInstitutionServiceSpy.getInstitutions.calls.reset();

      viewInstitutionServiceSpy.getChapters.calls.reset();

      institutionServiceSpy.downloadLogo.calls.reset();

      sanitizerSpy.bypassSecurityTrustUrl.calls.reset();

      viewInstitutionServiceSpy.getInstitutions.and.returnValue(of(mockInstitutions));

      viewInstitutionServiceSpy.getChapters.and.returnValue(of(mockChapters));

      institutionServiceSpy.downloadLogo.and.returnValue(of(mockBlob));

      sanitizerSpy.bypassSecurityTrustUrl.and.callFake((url: string) => url as any);

    fixture = TestBed.createComponent(ViewInstitution);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges(); // ngOnInit

    });

  // -----------------------------
  // BASIC TESTS
  // -----------------------------
  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------
  // SERVICE CALLS
  // -----------------------------
  it('should load institutions on init', () => {
    expect(viewInstitutionServiceSpy.getInstitutions).toHaveBeenCalled();
    expect(component.institution.length).toBe(1);
    expect(component.institution[0].insT_ID).toBe('INS001');
  });

  it('should load chapters on init', () => {
    expect(viewInstitutionServiceSpy.getChapters).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(3);
  });

  it('should load logo on init', () => {
    expect(institutionServiceSpy.downloadLogo).toHaveBeenCalledWith('inst_logo.png', true);
  });

  // -----------------------------
  // SEARCH
  // -----------------------------
  it('should filter chapters by search text', () => {
    component.onSearchEvent('A01');
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].chapterId).toBe('A01');
  });

  it('should reset to page 0 on search', () => {
    component.tableConfig.pagination!.pageIndex = 2;
    component.onSearchEvent('test');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
  });

  // -----------------------------
  // PAGINATION
  // -----------------------------
  it('should update pagination on page change', () => {
    component.onPageChange({
      pageIndex: 1,
      pageSize: 10,
      previousPageIndex: 0
    });

    expect(component.tableConfig.pagination!.pageIndex).toBe(1);
    expect(component.tableConfig.pagination!.pageSize).toBe(10);
  });

  // -----------------------------
  // SORTING
  // -----------------------------
  it('should sort chapters ascending', () => {
    component.onSortChange({
      column: 'chapterId',
      direction: 'A'
    });

    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.dataSource[0].chapterId).toBe('A01');
    expect(component.dataSource[1].chapterId).toBe('B02');
    expect(component.dataSource[2].chapterId).toBe('C03');
  });

  it('should sort chapters descending', () => {
    component.onSortChange({
      column: 'chapterId',
      direction: 'D'
    });

    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.dataSource[0].chapterId).toBe('C03');
    expect(component.dataSource[1].chapterId).toBe('B02');
    expect(component.dataSource[2].chapterId).toBe('A01');
  });

  it('should toggle between ascending and descending (2-state cycle)', () => {
    component.onSortChange({ column: 'chapterId', direction: 'A' });
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.dataSource[0].chapterId).toBe('A01');

    component.onSortChange({ column: 'chapterId', direction: 'D' });
    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.dataSource[0].chapterId).toBe('C03');

    component.onSortChange({ column: 'chapterId', direction: 'A' });
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.dataSource[0].chapterId).toBe('A01');
  });

  it('should not enter default sort state', () => {
    component.onSortChange({ column: 'chapterId', direction: 'D' });
    expect(component.tableConfig.sortConfig!.direction).not.toBe('default');

    component.onSortChange({ column: 'chapterId', direction: 'A' });
    expect(component.tableConfig.sortConfig!.direction).not.toBe('default');
  });

  // -----------------------------
  // TABLE CONFIGURATION
  // -----------------------------
  it('should only have chapterId as sortable column', () => {
    const columns = component.tableConfig.columns;
    const sortableColumns = columns.filter(col => col.sortable);
    expect(sortableColumns.length).toBe(1);
    expect(sortableColumns[0].key).toBe('chapterId');
  });

  it('should have chapterName, effDate, termDate as non-sortable', () => {
    const columns = component.tableConfig.columns;
    const chapterName = columns.find(col => col.key === 'chapterName');
    const effDate = columns.find(col => col.key === 'effDate');
    const termDate = columns.find(col => col.key === 'termDate');

    expect(chapterName?.sortable).toBeFalsy();
    expect(effDate?.sortable).toBeFalsy();
    expect(termDate?.sortable).toBeFalsy();
  });

  it('should include a Status column', () => {
    const columns = component.tableConfig.columns;
    const statusCol = columns.find(col => col.key === 'status');
    expect(statusCol).toBeTruthy();
    expect(statusCol!.header).toBe('Status');
  });

  it('should set actionsColumnHeader to Action', () => {
    expect(component.tableConfig.actionsColumnHeader).toBe('Action');
  });

  // -----------------------------
  // STATUS COMPUTATION
  // -----------------------------
  it('should compute status as Active when termDate is in the future', () => {
    expect(component.dataSource.length).toBe(3);
    component.dataSource.forEach(chapter => {
      expect(chapter.status).toBe('Active');
    });
  });

  it('should compute status as Inactive when termDate is in the past', () => {
    const pastChapters: ChapterModel[] = [
      {
        chapterId: 'X01',
        chapterName: 'Past Chapter',
        effDate: getPastDate(120),
        termDate: getPastDate(10),
      }
    ];

    viewInstitutionServiceSpy.getChapters.and.returnValue(of(pastChapters));
    component.loadChaptersData();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].status).toBe('Inactive');
  });

  it('should compute status as Active when termDate is null', () => {
    const noTermChapters: ChapterModel[] = [
      {
        chapterId: 'Y01',
        chapterName: 'No Term Chapter',
        effDate: getPastDate(30),
        termDate: undefined,
      }
    ];

    viewInstitutionServiceSpy.getChapters.and.returnValue(of(noTermChapters));
    component.loadChaptersData();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].status).toBe('Active');
  });

  // -----------------------------
  // INITIAL SORT ON LOAD
  // -----------------------------
  it('should apply initial sort when data is loaded', () => {
    // Default sortConfig is chapterId descending
    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.dataSource[0].chapterId).toBe('C03');
    expect(component.dataSource[1].chapterId).toBe('B02');
    expect(component.dataSource[2].chapterId).toBe('A01');
  });

  // -----------------------------
  // ROW ACTIONS
  // -----------------------------
  it('should navigate to edit chapter on row action', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.onRowAction({
      action: 'edit',
      row: mockChapters[0]
    });

    expect(navigateSpy).toHaveBeenCalledWith([
      '/application-administration/edit-chapter',
      'B02'
    ]);
  });

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  it('should navigate to edit institution page', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.goToEditInstitution();

    expect(navigateSpy).toHaveBeenCalledWith([
      'application-administration/common-validation/edit'
    ]);
  });

  it('should navigate to create chapter page', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.goToCreateChapter();

    expect(navigateSpy).toHaveBeenCalledWith([
      'application-administration/create-chapter'
    ]);
  });

  // -----------------------------
  // ERROR HANDLING
  // -----------------------------
  it('should handle institution service error', () => {
    viewInstitutionServiceSpy.getInstitutions.and.returnValue(
      throwError(() => new Error('Institution API error'))
    );

    spyOn(console, 'error');
    component.loadInstitutionAndChapters();

    expect(console.error).toHaveBeenCalledWith('Failed to load institution', jasmine.any(Error));
  });

  it('should handle chapters service error', () => {
    viewInstitutionServiceSpy.getChapters.and.returnValue(
      throwError(() => new Error('Chapters API error'))
    );

    component.loadChaptersData();

    expect(component.hasError).toBe(true);
    expect(component.errorMessage).toBe('Failed to load chapters. Please try again.');
    expect(component.isLoading).toBe(false);
  });

  it('should handle logo download error', () => {
    institutionServiceSpy.downloadLogo.and.returnValue(
      throwError(() => new Error('Logo download failed'))
    );

    spyOn(console, 'error');
    component.loadInstitutionAndChapters();

    expect(component.logoUrl).toBe('assets/DefaultImageInstitution.png');
    expect(console.error).toHaveBeenCalledWith('Failed to load logo', jasmine.any(Error));
  });

  // -----------------------------
  // FILTER CHIPS
  // -----------------------------
  it('should clear all filters', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    component.appliedFilters = {
      effectivePeriod: 'AFTER',
      effectiveDate: pastDate,
      terminationPeriod: null,
      terminationDate: null
    };
    component.filterChips = [{ key: 'test', label: 'Test', value: 'test' }];

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips.length).toBe(0);
  });

  it('should detect active filters', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);

    component.appliedFilters = null;
    expect(component.hasActiveFilters()).toBe(false);

    component.appliedFilters = {
      effectivePeriod: 'AFTER',
      effectiveDate: pastDate,
      terminationPeriod: null,
      terminationDate: null
    };
    expect(component.hasActiveFilters()).toBe(true);
  });
});
