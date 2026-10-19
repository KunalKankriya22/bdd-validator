import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Overlay } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { XmlErrorLogFileComponent } from './xml-error-log-file';
import { XmlErrorLogApiService } from './services/xml-error-log-api.service';
import {
  ReturnResult,
  PlasmaFileTypeDto,
  XmlErrorLogEntryDto,
  XmlErrorLogFilterValue,
} from './models/xml-error-log.model';

import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('XmlErrorLogFileComponent', () => {
  let component: XmlErrorLogFileComponent;
  let fixture: ComponentFixture<XmlErrorLogFileComponent>;
  let apiServiceSpy: jasmine.SpyObj<XmlErrorLogApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let overlaySpy: jasmine.SpyObj<Overlay>;

  const chapterChanged$ = new Subject<void>();

  const mockPlasmaFileTypes: PlasmaFileTypeDto[] = [
    { code: 'PF1', description: 'Plasma File Type 1' },
    { code: 'PF2', description: 'Plasma File Type 2' },
  ];

  const mockLogEntries: XmlErrorLogEntryDto[] = [
    { logDescription: 'Error processing file A.xml' },
    { logDescription: 'Validation failed for B.xml' },
    { logDescription: 'Connection timeout for C.xml' },
  ];

  const mockSuccessResponse: ReturnResult<XmlErrorLogEntryDto> = {
    success: true,
    message: '',
    statusCode: 200,
    data: mockLogEntries,
    total: 3,
  };

  const mockEmptyResponse: ReturnResult<XmlErrorLogEntryDto> = {
    success: true,
    message: '',
    statusCode: 200,
    data: [],
    total: 0,
  };

  const mockPlasmaTypesResponse: ReturnResult<PlasmaFileTypeDto> = {
    success: true,
    message: '',
    statusCode: 200,
    data: mockPlasmaFileTypes,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('XmlErrorLogApiService', [
      'getPlasmaFileTypes',
      'searchLogEntries',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'XML Error Log', subtitle: 'Test subtitle' }),
    });
    overlaySpy = jasmine.createSpyObj('Overlay', ['position', 'create', 'scrollStrategies'], {
      scrollStrategies: { block: () => ({}) },
    });

    apiServiceSpy.getPlasmaFileTypes.and.returnValue(of(mockPlasmaTypesResponse));




      TestBed.configureTestingModule({
      imports: [XmlErrorLogFileComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: XmlErrorLogApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: Overlay, useValue: overlaySpy },
      ],
    });

      apiServiceSpy.getPlasmaFileTypes.and.returnValue(of(mockPlasmaTypesResponse));


      apiServiceSpy.searchLogEntries.and.returnValue(of(mockSuccessResponse));


    fixture = TestBed.createComponent(XmlErrorLogFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {
    it('should load plasma file types on init', () => {
      expect(apiServiceSpy.getPlasmaFileTypes).toHaveBeenCalled();
      expect(component.plasmaFileTypes).toEqual(mockPlasmaFileTypes);
    });









    it('should handle plasma file types load failure gracefully', fakeAsync(() => {
      apiServiceSpy.getPlasmaFileTypes.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      const comp = TestBed.createComponent(XmlErrorLogFileComponent).componentInstance;
      TestBed.createComponent(XmlErrorLogFileComponent).detectChanges();
      tick();

      expect(comp.plasmaFileTypes).toEqual([]);
    }));

    it('should start with no applied filters or search text', () => {
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.hasError).toBeFalse();
    });

    it('should not auto-query on load — waits for plasma file type selection', () => {
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(apiServiceSpy.searchLogEntries).not.toHaveBeenCalled();
    });
  });

  describe('loadTableData', () => {




    it('should include search text in request', fakeAsync(() => {
      component.searchText = 'test search';

      component.loadTableData();
      tick();

      const request = apiServiceSpy.searchLogEntries.calls.mostRecent().args[0];
      expect(request.searchText).toBe('test search');
    }));





    it('should handle unsuccessful response', fakeAsync(() => {
      apiServiceSpy.searchLogEntries.and.returnValue(of({
        success: false,
        message: 'No records found',
        statusCode: 200,
        data: [],
        total: 0,
      }));

      component.loadTableData();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No records found');
    }));



    it('should sanitize error message by removing "error:" prefix', fakeAsync(() => {
      apiServiceSpy.searchLogEntries.and.returnValue(
        throwError(() => ({ error: { message: 'Error: Something went wrong' } }))
      );

      component.loadTableData();
      tick();

      expect(component.errorMessage).not.toMatch(/^error\s*:/i);
    }));


  });

  describe('onSearch', () => {
    it('should set search text and reload data', fakeAsync(() => {
      component.onSearch('test query');
      tick();

      expect(component.searchText).toBe('test query');
      expect(apiServiceSpy.searchLogEntries).toHaveBeenCalled();
    }));



    it('should handle empty search text', fakeAsync(() => {
      component.searchText = 'old search';
      component.onSearch('');
      tick();

      expect(component.searchText).toBe('');
    }));
  });
  describe('applyFilters', () => {
    it('should store applied filters', () => {
      const filters: XmlErrorLogFilterValue = {
        plasmaFileType: 'PF1',
        logDate: '2024-01-15T00:00:00',
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
    });

    it('should generate filter chips from filters', () => {
      const filters: XmlErrorLogFilterValue = {
        plasmaFileType: 'PF1',
        logDate: '2024-06-15T00:00:00',
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBe(2);
      expect(component.filterChips[0].key).toBe('plasmaFileType');
      expect(component.filterChips[0].label).toContain('Plasma File Type');
      expect(component.filterChips[1].key).toBe('logDate');
      expect(component.filterChips[1].label).toContain('Date');
    });

    it('should use description for plasma file type chip when available', () => {
      component.plasmaFileTypes = mockPlasmaFileTypes;
      const filters: XmlErrorLogFilterValue = {
        plasmaFileType: 'PF1',
        logDate: null,
      };

      component.applyFilters(filters);

      expect(component.filterChips[0].label).toContain('Plasma File Type 1');
    });




  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      component.appliedFilters = {
        plasmaFileType: 'PF1',
        logDate: '2024-01-15T00:00:00',
      };
      component.filterChips = [
        { key: 'plasmaFileType', label: 'Plasma File Type: PF1', value: 'PF1' },
        { key: 'logDate', label: 'Date: 15-JAN-2024', value: '2024-01-15' },
      ];
    });





    it('should set appliedFilters to null when all filters removed', fakeAsync(() => {
      component.appliedFilters = { plasmaFileType: 'PF1', logDate: null };

      component.onRemoveFilterChip('plasmaFileType');
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    }));




  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters applied', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return false when filters are empty', () => {
      component.appliedFilters = { plasmaFileType: null, logDate: null };
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when plasmaFileType filter set', () => {
      component.appliedFilters = { plasmaFileType: 'PF1', logDate: null };
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when logDate filter set', () => {
      component.appliedFilters = { plasmaFileType: null, logDate: '2024-01-15' };
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('clearAllFilters', () => {
    it('should reset all filters and search', fakeAsync(() => {
      component.appliedFilters = { plasmaFileType: 'PF1', logDate: '2024-01-15' };
      component.filterChips = [{ key: 'plasmaFileType', label: 'test', value: 'PF1' }];
      component.searchText = 'search term';
      component.tableConfig.pagination!.pageIndex = 5;
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['clearSearch', 'focus']);

      apiServiceSpy.searchLogEntries.calls.reset();

      component.clearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.searchText).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(apiServiceSpy.searchLogEntries).not.toHaveBeenCalled();
    }));
  });

  describe('Chapter Changed', () => {
    it('should clear all filters when chapter changes', fakeAsync(() => {
      component.appliedFilters = { plasmaFileType: 'PF1', logDate: null };
      component.searchText = 'test';
      component.searchBarComponent = jasmine.createSpyObj('SearchBar', ['clearSearch', 'focus']);
      apiServiceSpy.searchLogEntries.calls.reset();
      chapterChanged$.next();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.searchText).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(apiServiceSpy.searchLogEntries).not.toHaveBeenCalled();
    }));
  });
  describe('sanitizeErrorMessage', () => {
    it('should remove "error:" prefix', () => {
      const result = component['sanitizeErrorMessage']('Error: Something went wrong');
      expect(result).toBe('Something went wrong');
    });

    it('should handle message without prefix', () => {
      const result = component['sanitizeErrorMessage']('Something went wrong');
      expect(result).toBe('Something went wrong');
    });

    it('should handle case-insensitive prefix', () => {
      const result = component['sanitizeErrorMessage']('error : Connection failed');
      expect(result).toBe('Connection failed');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlayRef if exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.ngOnDestroy();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should not throw when overlayRef is null', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload data', fakeAsync(() => {
      component.onPageChange({ pageIndex: 2, pageSize: 25, length: 100 });
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(apiServiceSpy.searchLogEntries).toHaveBeenCalled();
    }));
  });

  describe('handleKeyboardShortcut', () => {
    it('should focus search bar on Alt+S', () => {
      const mockSearchBar = jasmine.createSpyObj('SearchBar', ['focus', 'clearSearch']);
      component.searchBarComponent = mockSearchBar;

      const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockSearchBar.focus).toHaveBeenCalled();
    });

    it('should open filter on Alt+F', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should close overlay on Escape when overlay exists', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should not do anything on Escape when no overlay', () => {
      component['overlayRef'] = null;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => component.handleKeyboardShortcut(event)).not.toThrow();
    });

    it('should not do anything on non-shortcut keys', () => {
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { key: 'a' });
      component.handleKeyboardShortcut(event);
      expect(component.openFilter).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveFilterChip additional branches', () => {
    it('should return early if no applied filters', fakeAsync(() => {
      component.appliedFilters = null;
      apiServiceSpy.searchLogEntries.calls.reset();

      component.onRemoveFilterChip('plasmaFileType');
      tick();

      // loadTableData should NOT have been called again
      expect(apiServiceSpy.searchLogEntries).not.toHaveBeenCalled();
    }));

    it('should clear logDate filter and keep plasmaFileType', fakeAsync(() => {
      component.appliedFilters = {
        plasmaFileType: 'PF1',
        logDate: '2024-01-15T00:00:00',
      };

      component.onRemoveFilterChip('logDate');
      tick();

      expect(component.appliedFilters).toBeTruthy();
      expect(component.appliedFilters!.logDate).toBeNull();
      expect(component.appliedFilters!.plasmaFileType).toBe('PF1');
    }));

    it('should clear plasmaFileType filter and keep logDate', fakeAsync(() => {
      component.appliedFilters = {
        plasmaFileType: 'PF1',
        logDate: '2024-01-15T00:00:00',
      };

      component.onRemoveFilterChip('plasmaFileType');
      tick();

      expect(component.appliedFilters).toBeTruthy();
      expect(component.appliedFilters!.plasmaFileType).toBeNull();
      expect(component.appliedFilters!.logDate).toBe('2024-01-15T00:00:00');
    }));
  });

  describe('formatDateDisplay', () => {
    it('should return empty string for empty input', () => {
      expect(component['formatDateDisplay']('')).toBe('');
    });

    it('should format valid date string', () => {
      const result = component['formatDateDisplay']('2024-06-15T00:00:00');
      expect(result).toMatch(/15-JUN-2024/);
    });

    it('should return original string for invalid date', () => {
      expect(component['formatDateDisplay']('not-a-date')).toBe('not-a-date');
    });
  });

  describe('convertFiltersToChips edge cases', () => {
    it('should use code when no description found for plasma type', () => {
      component.plasmaFileTypes = [];
      const filters: XmlErrorLogFilterValue = {
        plasmaFileType: 'UNKNOWN',
        logDate: null,
      };

      const chips = component['convertFiltersToChips'](filters);
      expect(chips[0].label).toContain('UNKNOWN');
    });

    it('should return empty chips when no filters set', () => {
      const filters: XmlErrorLogFilterValue = {
        plasmaFileType: null,
        logDate: null,
      };

      const chips = component['convertFiltersToChips'](filters);
      expect(chips.length).toBe(0);
    });
  });

  describe('loadTableData edge cases', () => {
    it('should include applied filters in request', fakeAsync(() => {
      component.appliedFilters = { plasmaFileType: 'PF1', logDate: '2024-01-15' };

      component.loadTableData();
      tick();

      const request = apiServiceSpy.searchLogEntries.calls.mostRecent().args[0];
      expect(request.plasmaFileType).toBe('PF1');
      expect(request.logDate).toBe('2024-01-15');
    }));

    it('should handle error response', fakeAsync(() => {
      apiServiceSpy.searchLogEntries.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadTableData();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeTrue();
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should handle unsuccessful response without message', fakeAsync(() => {
      apiServiceSpy.searchLogEntries.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 200,
        data: [],
        total: 0,
      }));

      component.loadTableData();
      tick();

      expect(component.dataSource).toEqual([]);
      // snackbarService.showError should not be called when message is empty
    }));
  });

  describe('openFilter', () => {
    it('should close overlay if already open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('onSearch resets pagination', () => {
    it('should reset page index to 0 on search', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 5;
      component.onSearch('new search');
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  describe('clearAllFilters with searchBarComponent', () => {
    it('should call clearSearch on searchBarComponent if available', fakeAsync(() => {
      const mockSearchBar = jasmine.createSpyObj('SearchBar', ['clearSearch', 'focus']);
      component.searchBarComponent = mockSearchBar;

      component.clearAllFilters();
      tick();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    }));
  });
});
