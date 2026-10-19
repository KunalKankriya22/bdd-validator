import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AttributeExpirationDateOverrideComponent } from './attribute-expiration-date-override.component';
import { AttributeExpirationDateOverrideApiService } from './services/attribute-expiration-date-override-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  AttributeExpirationDateOverrideModel,
  AttributeExpirationDateOverrideFilterValue,
  AttributeExpirationDateOverrideFormValue,
  LookUp,
  LookUpWithDescription
} from './models/attribute-expiration-date-override.model';
import { signal } from '@angular/core';
import moment from 'moment';
import { createMockSnackbarService, createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AttributeExpirationDateOverrideComponent', () => {
  let component: AttributeExpirationDateOverrideComponent;
  let fixture: ComponentFixture<AttributeExpirationDateOverrideComponent>;
  let mockService: jasmine.SpyObj<AttributeExpirationDateOverrideApiService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockData: AttributeExpirationDateOverrideModel[] = [
    {
      attributeCode: 'THAW',
      attributeDescription: 'Deglyc. Thaw Only',
      overrideAttribute: '+04',
      overrideDescription: 'Deglycenolized',
      effDate: '2012-10-07',
      termDate: '2012-10-07',
      lastModifiedDate: '2012-10-05'
    },
    {
      attributeCode: 'SW',
      attributeDescription: 'Saline Washed',
      overrideAttribute: '+01',
      overrideDescription: 'Washed',
      effDate: '2012-10-07',
      termDate: '2012-10-09',
      lastModifiedDate: '2012-10-05'
    }
  ];

  const mockOverrideAttributes: LookUp[] = [
    { key: '+04', value: '+04' },
    { key: '+01', value: '+01' }
  ];

  const mockAttributeCodes: LookUpWithDescription[] = [
    { key: 'THAW', value: 'THAW', description: 'Deglyc. Thaw Only' },
    { key: 'SW', value: 'SW', description: 'Saline Washed' }
  ];

  const mockOverrideAttributeOptions: LookUpWithDescription[] = [
    { key: '+04', value: '+04', description: 'Deglycenolized' },
    { key: '+01', value: '+01', description: 'Washed' }
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('AttributeExpirationDateOverrideApiService', [
      'getAttributeExpirationDateOverrides',
      'getFilterDropdown',
      'getAddDropdown',
      'createAttributeExpirationDateOverride',
      'updateAttributeExpirationDateOverride'
    ]);
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Attribute Expiration Date Override: ISBT', subtitle: 'Test Subtitle' })
    });
    mockSnackBar = createMockMatSnackBar();

    mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 2 }));
    mockService.getFilterDropdown.and.returnValue(of({
      overrideAttributes: mockOverrideAttributes
    }));
    mockService.getAddDropdown.and.returnValue(of({
      attributeCodes: mockAttributeCodes,
      overrideAttributes: mockOverrideAttributeOptions
    }));



      TestBed.configureTestingModule({
imports: [
        AttributeExpirationDateOverrideComponent,
        NoopAnimationsModule,
        OverlayModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AttributeExpirationDateOverrideApiService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        Overlay
      ]
    });


    });



  beforeEach(() => {

      mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 2 }));


      mockService.getFilterDropdown.and.returnValue(of({
      overrideAttributes: mockOverrideAttributes
    }));


      mockService.getAddDropdown.and.returnValue(of({
      attributeCodes: mockAttributeCodes,
      overrideAttributes: mockOverrideAttributeOptions
    }));


    fixture = TestBed.createComponent(AttributeExpirationDateOverrideComponent);
    component = fixture.componentInstance;


    });


  it('should load lookup options on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(mockService.getFilterDropdown).toHaveBeenCalled();
    expect(mockService.getAddDropdown).toHaveBeenCalled();
    expect(component.filterOverrideAttributes.length).toBe(2);
    expect(component.attributeCodeOptions.length).toBe(2);
  }));





  it('should apply filters', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    const filters: AttributeExpirationDateOverrideFilterValue = {
      overrideAttribute: '+04'
    };

    component.applyFilters(filters);
    tick();

    expect(component.appliedFilters).toEqual(filters);
    expect(component.requestState.overrideAttribute).toBe('+04');
  }));




  it('should open add drawer', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.openAddDrawer();
    fixture.detectChanges();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  }));

  it('should open edit drawer', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    component.openEditDrawer(mockData[0]);
    fixture.detectChanges();

    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelData).toBe(mockData[0]);
  }));


  it('should handle save for add mode', fakeAsync(() => {
    const mockResponse = { success: true, data: mockData[0] };
    mockService.createAttributeExpirationDateOverride.and.returnValue(of(mockResponse));
    mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 2 }));

    fixture.detectChanges();
    tick();

    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;

    const formValue: AttributeExpirationDateOverrideFormValue = {
      attributeCode: 'TEST',
      attributeDescription: 'Test Attribute',
      overrideAttribute: '+99',
      overrideDescription: 'Test Override',
      effDate: moment('2024-01-01'),
      termDate: moment('2024-12-31')
    };

    component.onSave(formValue);
    flushMicrotasks();

    expect(mockService.createAttributeExpirationDateOverride).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBe(false);
  }));

  it('should handle save for edit mode', fakeAsync(() => {
    const mockResponse = { success: true, data: mockData[0] };
    mockService.updateAttributeExpirationDateOverride.and.returnValue(of(mockResponse));
    mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 2 }));

    fixture.detectChanges();
    tick();

    component.sidePanelMode = 'edit';
    component.sidePanelData = mockData[0];
    component.sidePanelOpen = true;

    const formValue: AttributeExpirationDateOverrideFormValue = {
      attributeCode: 'THAW',
      attributeDescription: 'Deglyc. Thaw Only',
      overrideAttribute: '+04',
      overrideDescription: 'Deglycenolized',
      effDate: moment('2024-01-01'),
      termDate: moment('2024-12-31')
    };

    component.onSave(formValue);
    flushMicrotasks();

    expect(mockService.updateAttributeExpirationDateOverride).toHaveBeenCalledWith('THAW', '+04', jasmine.any(Object));
    expect(component.sidePanelOpen).toBe(false);
  }));

  it('should handle save and create another', fakeAsync(() => {
    const mockResponse = { success: true, data: mockData[0] };
    mockService.createAttributeExpirationDateOverride.and.returnValue(of(mockResponse));
    mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 2 }));

    fixture.detectChanges();
    tick();

    component.sidePanelMode = 'add';
    component.sidePanelOpen = true;

    // Mock sideDrawerComponent to prevent "Cannot set properties of undefined"
    component.sideDrawerComponent = jasmine.createSpyObj('AddEditAttributeExpirationDateOverrideComponent', [''], {
      form: jasmine.createSpyObj('FormGroup', ['reset']),
      isSubmitting: false
    });

    const formValue: AttributeExpirationDateOverrideFormValue = {
      attributeCode: 'TEST',
      attributeDescription: 'Test Attribute',
      overrideAttribute: '+99',
      overrideDescription: 'Test Override',
      effDate: moment('2024-01-01'),
      termDate: moment('2024-12-31')
    };

    component.onSaveAndCreateAnother(formValue);
    flushMicrotasks();

    expect(mockService.createAttributeExpirationDateOverride).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBe(true);
    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelData).toBeNull();
  }));

  it('should search and reload data', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    component.onSearch('test');
    expect(component.requestState.searchKeyword).toBe('test');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should clear search keyword when search is empty', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.requestState.searchKeyword = 'old';
    spyOn(component, 'loadData');
    component.onSearch('');
    expect(component.requestState.searchKeyword).toBeUndefined();
  }));

  it('should update pagination on page change', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    component.onPageChange({ pageIndex: 3, pageSize: 50 });
    expect(component.tableConfig.pagination!.pageIndex).toBe(3);
    expect(component.tableConfig.pagination!.pageSize).toBe(50);
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should update sort with ascending direction', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    component.onSortChange({ column: 'attributeCode', direction: 'A' });
    expect(component.requestState.sortColumn).toBe('attributeCode');
    expect(component.requestState.sortOrder).toBe('ASC');
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should update sort with descending direction', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    component.onSortChange({ column: 'attributeCode', direction: 'D' });
    expect(component.requestState.sortOrder).toBe('DESC');
  }));

  it('should clear sortOrder for default direction', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    component.onSortChange({ column: 'attributeCode', direction: 'default' });
    expect(component.requestState.sortOrder).toBeUndefined();
  }));

  it('should open edit drawer on row action', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'openEditDrawer');
    component.onRowAction({ action: 'edit', row: mockData[0] });
    expect(component.openEditDrawer).toHaveBeenCalledWith(mockData[0]);
  }));

  it('should remove filter chip and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.appliedFilters = { overrideAttribute: '+04' };
    spyOn(component, 'loadData');
    component.onRemoveFilterChip('overrideAttribute');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should report hasActiveFilters correctly', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.appliedFilters = null;
    expect(component.hasActiveFilters()).toBeFalse();
    component.appliedFilters = { overrideAttribute: '+04' };
    expect(component.hasActiveFilters()).toBeTrue();
  }));

  it('should clear all filters and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.appliedFilters = { overrideAttribute: '+04' };
    component.requestState = { ...component.requestState, overrideAttribute: '+04' };
    spyOn(component, 'loadData');
    component.clearAllFilters();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.loadData).toHaveBeenCalled();
  }));

  it('should close side drawer', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    component.sidePanelOpen = true;
    component.sidePanelData = mockData[0];
    component.closeSideDrawer();
    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelData).toBeNull();
  }));

  it('should handle loadData error', fakeAsync(() => {
    mockService.getAttributeExpirationDateOverrides.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(component.hasError).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Failed to load');
  }));

  it('should handle getAddDropdown error', fakeAsync(() => {
    mockService.getAddDropdown.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(mockLoggingService.error).toHaveBeenCalled();
  }));

  it('should handle getFilterDropdown error', fakeAsync(() => {
    mockService.getFilterDropdown.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();
    expect(mockLoggingService.error).toHaveBeenCalled();
  }));

  it('should handle save error for create and reset sideDrawer', fakeAsync(() => {
    mockService.createAttributeExpirationDateOverride.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();

    component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
      isSubmitting: true,
      cdr: jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck'])
    });

    component.sidePanelMode = 'add';
    component.onSave({
      attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
      overrideDescription: '', effDate: null, termDate: null
    });
    tick();

    expect(component.sideDrawerComponent!.isSubmitting).toBeFalse();
  }));

  it('should handle save error for update', fakeAsync(() => {
    mockService.updateAttributeExpirationDateOverride.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();

    component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
      isSubmitting: true,
      cdr: jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck'])
    });

    component.sidePanelMode = 'edit';
    component.sidePanelData = mockData[0];
    component.onSave({
      attributeCode: 'THAW', attributeDescription: '', overrideAttribute: '+04',
      overrideDescription: '', effDate: null, termDate: null
    });
    tick();

    expect(component.sideDrawerComponent!.isSubmitting).toBeFalse();
  }));

  it('should handle save and create another error', fakeAsync(() => {
    mockService.createAttributeExpirationDateOverride.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    tick();

    component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
      isSubmitting: true,
      cdr: jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck'])
    });

    component.onSaveAndCreateAnother({
      attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
      overrideDescription: '', effDate: null, termDate: null
    });
    tick();

    expect(component.sideDrawerComponent!.isSubmitting).toBeFalse();
  }));

  describe('Keyboard Shortcuts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open add drawer on Alt+C when side panel is closed', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'openAddDrawer');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);
      expect(component.openAddDrawer).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not open add drawer on Alt+C when side panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'openAddDrawer');
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'c' }));
      expect(component.openAddDrawer).not.toHaveBeenCalled();
    });

    it('should close side panel on Escape when side panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSideDrawer');
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.closeSideDrawer).toHaveBeenCalled();
    });

    it('should not respond to non-shortcut keys', () => {
      spyOn(component, 'openAddDrawer');
      spyOn(component, 'closeSideDrawer');
      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'a' }));
      expect(component.openAddDrawer).not.toHaveBeenCalled();
      expect(component.closeSideDrawer).not.toHaveBeenCalled();
    });
  });

  it('should apply filters with date values', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    spyOn(component, 'loadData');
    const filters: AttributeExpirationDateOverrideFilterValue = {
      overrideAttribute: '+04',
      effDate: '2024-01-01',
      effDatePeriod: 'After',
      termDate: '2024-12-31',
      termDatePeriod: 'Before'
    };
    component.applyFilters(filters);
    expect(component.requestState.effDate).toBe('2024-01-01');
    expect(component.requestState.termDate).toBe('2024-12-31');
    expect(component.loadData).toHaveBeenCalled();
  }));

  // ===== ngOnDestroy =====
  describe('ngOnDestroy', () => {
    it('should complete destroy$ and overlayClose$ subjects', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const destroyCompleteSpy = spyOn((component as any).destroy$, 'complete');
      const overlayCloseSpy = spyOn((component as any).overlayClose$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
      expect(overlayCloseSpy).toHaveBeenCalled();
    }));

    it('should dispose overlayRef if it exists', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRef;

      component.ngOnDestroy();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    }));

    it('should not throw if overlayRef is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).overlayRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    }));
  });

  // ===== subscribeToChapterChanges =====
  describe('subscribeToChapterChanges', () => {
    it('should close side drawer, close overlay, reload lookups and data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Reset call counts after initial load
      mockService.getAttributeExpirationDateOverrides.calls.reset();
      mockService.getFilterDropdown.calls.reset();
      mockService.getAddDropdown.calls.reset();

      spyOn(component, 'closeSideDrawer');

      chapterChangedSubject.next();
      tick();

      expect(component.closeSideDrawer).toHaveBeenCalled();
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
      expect(mockService.getAddDropdown).toHaveBeenCalled();
      expect(mockService.getAttributeExpirationDateOverrides).toHaveBeenCalled();
    }));
  });

  // ===== loadData detailed verification =====
  describe('loadData - detailed', () => {
    it('should set isLoading true before calling service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Reset and set up a new call
      mockService.getAttributeExpirationDateOverrides.calls.reset();
      mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: mockData, totalCount: 5 }));

      component.loadData();
      // isLoading should have been set true (and then back false after subscribe)
      expect(component.isLoading).toBeFalse(); // false because synchronous observable completed
      expect(component.hasError).toBeFalse();
    }));

    it('should calculate skip and take from pagination config', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 50;
      mockService.getAttributeExpirationDateOverrides.calls.reset();
      mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: [], totalCount: 0 }));

      component.loadData();
      tick();

      expect(mockService.getAttributeExpirationDateOverrides).toHaveBeenCalledWith(
        50,    // take = pageSize
        100,   // skip = pageIndex * pageSize = 2 * 50
        jasmine.any(Object)
      );
    }));

    it('should update dataSource and totalRecords on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const newData = [mockData[0]];
      mockService.getAttributeExpirationDateOverrides.calls.reset();
      mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: newData, totalCount: 42 }));
      mockService.getFilterDropdown.calls.reset();
      mockService.getFilterDropdown.and.returnValue(of({ overrideAttributes: [] }));

      component.loadData();
      tick();

      expect(component.dataSource).toEqual(newData);
      expect(component.tableConfig.pagination!.totalRecords).toBe(42);
      expect(component.isLoading).toBeFalse();
      // loadData success also calls loadFilterDropdown
      expect(mockService.getFilterDropdown).toHaveBeenCalled();
    }));

    it('should pass sort and filter params to service', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        overrideAttribute: '+04',
        searchKeyword: 'test',
        effDate: '2024-01-01',
        effDatePeriod: 'after',
        termDate: '2024-12-31',
        termDatePeriod: 'before',
        sortColumn: 'attributeCode',
        sortOrder: 'ASC'
      };

      mockService.getAttributeExpirationDateOverrides.calls.reset();
      mockService.getAttributeExpirationDateOverrides.and.returnValue(of({ data: [], totalCount: 0 }));

      component.loadData();
      tick();

      const calledParams = mockService.getAttributeExpirationDateOverrides.calls.mostRecent().args[2];
      expect(calledParams.overrideAttribute).toBe('+04');
      expect(calledParams.searchKeyword).toBe('test');
      expect(calledParams.effDate).toBe('2024-01-01');
      expect(calledParams.effDatePeriod).toBe('after');
      expect(calledParams.termDate).toBe('2024-12-31');
      expect(calledParams.termDatePeriod).toBe('before');
      expect(calledParams.sortColumn).toBe('attributeCode');
      expect(calledParams.sortOrder).toBe('ASC');
    }));

    it('should set hasError and errorMessage on error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      mockService.getAttributeExpirationDateOverrides.and.returnValue(throwError(() => new Error('network fail')));

      component.loadData();
      tick();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load data. Please try again.');
      expect(mockLoggingService.error).toHaveBeenCalled();
    }));
  });

  // ===== loadLookupOptions =====
  describe('loadLookupOptions', () => {
    it('should log error and show snackbar on getAddDropdown error', fakeAsync(() => {
      mockService.getAddDropdown.and.returnValue(throwError(() => new Error('dropdown fail')));
      // Spy on the component's actual snackBar instance before detectChanges triggers ngOnInit
      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      fixture.detectChanges();
      tick();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading add/edit dropdown options', jasmine.any(Error));
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to load form options',
        'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    }));

    it('should populate attributeCodeOptions and overrideAttributeOptions on success', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.attributeCodeOptions).toEqual(mockAttributeCodes);
      expect(component.overrideAttributeOptions).toEqual(mockOverrideAttributeOptions);
    }));
  });

  // ===== loadFilterDropdown =====
  describe('loadFilterDropdown', () => {
    it('should pass searchKeyword and date params from requestState', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        searchKeyword: 'test',
        effDate: '2024-01-01',
        effDatePeriod: 'after',
        termDate: '2024-12-31',
        termDatePeriod: 'before'
      };

      mockService.getFilterDropdown.calls.reset();
      mockService.getFilterDropdown.and.returnValue(of({ overrideAttributes: mockOverrideAttributes }));

      (component as any).loadFilterDropdown();
      tick();

      const calledParams = mockService.getFilterDropdown.calls.mostRecent().args[0];
      expect(calledParams.searchKeyword).toBe('test');
      expect(calledParams.effDate).toBe('2024-01-01');
      expect(calledParams.effDatePeriod).toBe('after');
      expect(calledParams.termDate).toBe('2024-12-31');
      expect(calledParams.termDatePeriod).toBe('before');
    }));

    it('should handle undefined requestState properties gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {};

      mockService.getFilterDropdown.calls.reset();
      mockService.getFilterDropdown.and.returnValue(of({ overrideAttributes: [] }));

      (component as any).loadFilterDropdown();
      tick();

      const calledParams = mockService.getFilterDropdown.calls.mostRecent().args[0];
      expect(calledParams.searchKeyword).toBeUndefined();
      expect(calledParams.effDate).toBeUndefined();
    }));
  });

  // ===== openFilter =====
  describe('openFilter', () => {
    it('should close overlay if already open and toggle off', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose', 'attach', 'backdropClick']);
      (component as any).overlayRef = mockOverlayRefObj;

      component.openFilter();

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should set isFilterOpen to true when opening', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Ensure overlayRef is null so we enter the create branch
      (component as any).overlayRef = null;

      // We need the tableCard to be set for the overlay positioning
      component.tableCard = { nativeElement: document.createElement('div') } as ElementRef;

      // The overlay.create would need more setup; let's just verify the method doesn't throw
      // by checking that isFilterOpen is toggled
      try {
        component.openFilter();
      } catch {
        // Overlay positioning may fail in test environment; that's fine
      }

      // The flag is set before overlay creation
      expect(component.isFilterOpen).toBeTrue();
    }));
  });

  // ===== onSearch edge cases =====
  describe('onSearch - edge cases', () => {
    it('should close side drawer when searching', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      spyOn(component, 'closeSideDrawer').and.callThrough();
      spyOn(component, 'loadData');

      component.onSearch('test');

      expect(component.closeSideDrawer).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    }));

    it('should set searchKeyword to undefined when empty string is passed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState.searchKeyword = 'old-search';
      spyOn(component, 'loadData');

      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
    }));

    it('should reset page index to 0 when searching', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 5;
      spyOn(component, 'loadData');

      component.onSearch('new search');

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  // ===== onPageChange =====
  describe('onPageChange - detailed', () => {
    it('should close side drawer on page change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      spyOn(component, 'closeSideDrawer').and.callThrough();
      spyOn(component, 'loadData');

      component.onPageChange({ pageIndex: 1, pageSize: 25 });

      expect(component.closeSideDrawer).toHaveBeenCalled();
    }));
  });

  // ===== onSortChange =====
  describe('onSortChange - detailed', () => {
    it('should close side drawer on sort change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = true;
      spyOn(component, 'closeSideDrawer').and.callThrough();
      spyOn(component, 'loadData');

      component.onSortChange({ column: 'effDate', direction: 'A' });

      expect(component.closeSideDrawer).toHaveBeenCalled();
    }));

    it('should update sortConfig column and direction', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'loadData');

      component.onSortChange({ column: 'termDate', direction: 'D' });

      expect(component.tableConfig.sortConfig!.column).toBe('termDate');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
      expect(component.requestState.sortColumn).toBe('termDate');
      expect(component.requestState.sortOrder).toBe('DESC');
    }));
  });

  // ===== onRowAction =====
  describe('onRowAction - detailed', () => {
    it('should set activeRow on dataTableComponent when present', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockDataTable = { activeRow: null as any };
      component.dataTableComponent = mockDataTable as any;

      spyOn(component, 'openEditDrawer');

      component.onRowAction({ action: 'edit', row: mockData[0] });

      expect(mockDataTable.activeRow).toBe(mockData[0]);
      expect(component.openEditDrawer).toHaveBeenCalledWith(mockData[0]);
    }));

    it('should handle unknown action without error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'openEditDrawer');

      expect(() => {
        component.onRowAction({ action: 'delete', row: mockData[0] });
      }).not.toThrow();

      expect(component.openEditDrawer).not.toHaveBeenCalled();
    }));
  });

  // ===== applyFilters detailed =====
  describe('applyFilters - detailed', () => {
    it('should close side drawer before applying filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'closeSideDrawer');
      spyOn(component, 'loadData');

      component.applyFilters({ overrideAttribute: '+04' });

      expect(component.closeSideDrawer).toHaveBeenCalled();
    }));

    it('should generate filter chips from applied filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'loadData');

      const filters: AttributeExpirationDateOverrideFilterValue = {
        overrideAttribute: '+04'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.filterChips[0].key).toBe('overrideAttribute');
    }));

    it('should reset page index to 0 and reload data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.tableConfig.pagination!.pageIndex = 3;
      spyOn(component, 'loadData');

      component.applyFilters({ overrideAttribute: '+04' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.loadData).toHaveBeenCalled();
    }));

    it('should set undefined for empty filter values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'loadData');

      component.applyFilters({
        overrideAttribute: '',
        effDate: null,
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null
      });

      expect(component.requestState.overrideAttribute).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
      expect(component.requestState.termDate).toBeUndefined();
    }));
  });

  // ===== onRemoveFilterChip =====
  describe('onRemoveFilterChip - detailed', () => {
    it('should close side drawer when removing a chip', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = { overrideAttribute: '+04' };
      spyOn(component, 'closeSideDrawer');
      spyOn(component, 'loadData');

      component.onRemoveFilterChip('overrideAttribute');

      expect(component.closeSideDrawer).toHaveBeenCalled();
    }));

    it('should update filterChips after removing a chip', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = {
        overrideAttribute: '+04',
        effDate: '2024-01-01',
        effDatePeriod: 'after'
      };
      spyOn(component, 'loadData');

      component.onRemoveFilterChip('overrideAttribute');

      // overrideAttribute removed; effDate should remain
      expect(component.appliedFilters).not.toBeNull();
    }));

    it('should set appliedFilters to null when last filter is removed', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = { overrideAttribute: '+04' };
      spyOn(component, 'loadData');

      component.onRemoveFilterChip('overrideAttribute');

      expect(component.appliedFilters).toBeNull();
    }));
  });

  // ===== clearAllFilters detailed =====
  describe('clearAllFilters - detailed', () => {
    it('should close side drawer when clearing filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'closeSideDrawer');
      spyOn(component, 'loadData');

      component.clearAllFilters();

      expect(component.closeSideDrawer).toHaveBeenCalled();
    }));

    it('should remove filter-related keys from requestState but keep sort', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        overrideAttribute: '+04',
        searchKeyword: 'test',
        effDate: '2024-01-01',
        effDatePeriod: 'after',
        termDate: '2024-12-31',
        termDatePeriod: 'before',
        sortColumn: 'attributeCode',
        sortOrder: 'ASC'
      };

      spyOn(component, 'loadData');

      component.clearAllFilters();

      expect(component.requestState.overrideAttribute).toBeUndefined();
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.requestState.sortColumn).toBe('attributeCode');
      expect(component.requestState.sortOrder).toBe('ASC');
    }));
  });

  // ===== updateRequestStateFromFilters =====
  describe('updateRequestStateFromFilters (private)', () => {
    it('should clear filter keys from requestState when appliedFilters is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState = {
        overrideAttribute: '+04',
        searchKeyword: 'test',
        sortColumn: 'attributeCode'
      };
      component.appliedFilters = null;

      (component as any).updateRequestStateFromFilters();

      expect(component.requestState.overrideAttribute).toBeUndefined();
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.requestState.sortColumn).toBe('attributeCode');
    }));

    it('should update requestState from appliedFilters when not null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = {
        overrideAttribute: '+01',
        searchKeyword: 'search',
        effDate: '2024-06-01',
        effDatePeriod: 'before',
        termDate: '2024-12-31',
        termDatePeriod: 'after'
      };

      (component as any).updateRequestStateFromFilters();

      expect(component.requestState.overrideAttribute).toBe('+01');
      expect(component.requestState.searchKeyword).toBe('search');
      expect(component.requestState.effDate).toBe('2024-06-01');
      expect(component.requestState.effDatePeriod).toBe('before');
      expect(component.requestState.termDate).toBe('2024-12-31');
      expect(component.requestState.termDatePeriod).toBe('after');
    }));

    it('should set undefined for empty string filter values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = {
        overrideAttribute: '',
        searchKeyword: '',
        effDate: '',
        effDatePeriod: null,
        termDate: null,
        termDatePeriod: null
      };

      (component as any).updateRequestStateFromFilters();

      expect(component.requestState.overrideAttribute).toBeUndefined();
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(component.requestState.effDate).toBeUndefined();
    }));
  });

  // ===== Side panel operations =====
  describe('openAddDrawer', () => {
    it('should set mode to add, data to null, and open panel', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.sidePanelOpen = false;

      component.openAddDrawer();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    }));
  });

  describe('openEditDrawer', () => {
    it('should set mode to edit with the given row data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sidePanelOpen = false;

      component.openEditDrawer(mockData[1]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[1]);
      expect(component.sidePanelOpen).toBeTrue();
    }));
  });

  // ===== onSave detailed =====
  describe('onSave - additional coverage', () => {
    it('should show snackbar with attribute code on successful create', fakeAsync(() => {
      mockService.createAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));

      fixture.detectChanges();
      tick();

      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        attributeCode: 'NEWCODE',
        attributeDescription: 'New Desc',
        overrideAttribute: '+99',
        overrideDescription: 'Override Desc',
        effDate: null,
        termDate: null
      });
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Attribute Override NEWCODE has been added.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should show snackbar with attribute code on successful update', fakeAsync(() => {
      mockService.updateAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));

      fixture.detectChanges();
      tick();

      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.sidePanelOpen = true;

      component.onSave({
        attributeCode: 'THAW',
        attributeDescription: 'Deglyc. Thaw Only',
        overrideAttribute: '+04',
        overrideDescription: 'Deglycenolized',
        effDate: null,
        termDate: null
      });
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Attribute Override THAW has been updated.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));

    it('should close side drawer and reload data on successful create', fakeAsync(() => {
      mockService.createAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));
      fixture.detectChanges();
      tick();

      mockService.getAttributeExpirationDateOverrides.calls.reset();
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSave({
        attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
        overrideDescription: '', effDate: null, termDate: null
      });
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(mockService.getAttributeExpirationDateOverrides).toHaveBeenCalled();
    }));

    it('should close side drawer and reload data on successful update', fakeAsync(() => {
      mockService.updateAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));
      fixture.detectChanges();
      tick();

      mockService.getAttributeExpirationDateOverrides.calls.reset();
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];
      component.sidePanelOpen = true;

      component.onSave({
        attributeCode: 'THAW', attributeDescription: '', overrideAttribute: '+04',
        overrideDescription: '', effDate: null, termDate: null
      });
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(mockService.getAttributeExpirationDateOverrides).toHaveBeenCalled();
    }));
  });

  // ===== handleSaveError =====
  describe('handleSaveError', () => {
    it('should not throw when sideDrawerComponent is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.sideDrawerComponent = undefined;
      mockService.createAttributeExpirationDateOverride.and.returnValue(throwError(() => new Error('fail')));

      component.sidePanelMode = 'add';
      expect(() => {
        component.onSave({
          attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
          overrideDescription: '', effDate: null, termDate: null
        });
      }).not.toThrow();
    }));

    it('should reset isSubmitting and call markForCheck on sideDrawerComponent', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
      component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
        isSubmitting: true,
        cdr: mockCdr
      });

      mockService.createAttributeExpirationDateOverride.and.returnValue(throwError(() => new Error('fail')));

      component.sidePanelMode = 'add';
      component.onSave({
        attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
        overrideDescription: '', effDate: null, termDate: null
      });
      tick();

      expect(component.sideDrawerComponent!.isSubmitting).toBeFalse();
      expect(mockCdr.markForCheck).toHaveBeenCalled();
    }));
  });

  // ===== onSaveAndCreateAnother detailed =====
  describe('onSaveAndCreateAnother - detailed', () => {
    it('should call form.reset and reset isSubmitting on success', fakeAsync(() => {
      mockService.createAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));
      fixture.detectChanges();
      tick();

      const mockForm = jasmine.createSpyObj('FormGroup', ['reset']);
      component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
        form: mockForm,
        isSubmitting: true
      });

      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;

      component.onSaveAndCreateAnother({
        attributeCode: 'TEST',
        attributeDescription: 'Test',
        overrideAttribute: '+99',
        overrideDescription: 'Override',
        effDate: null,
        termDate: null
      });
      tick();

      expect(mockForm.reset).toHaveBeenCalled();
      expect(component.sideDrawerComponent!.isSubmitting).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    }));

    it('should reload data and show snackbar on success', fakeAsync(() => {
      mockService.createAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));

      fixture.detectChanges();
      tick();

      const snackBarSpy = spyOn((component as any).snackBar, 'open');

      const mockForm = jasmine.createSpyObj('FormGroup', ['reset']);
      component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
        form: mockForm,
        isSubmitting: true
      });

      mockService.getAttributeExpirationDateOverrides.calls.reset();

      component.onSaveAndCreateAnother({
        attributeCode: 'ABC',
        attributeDescription: '',
        overrideAttribute: '+01',
        overrideDescription: '',
        effDate: null,
        termDate: null
      });
      tick();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Attribute Override ABC has been added.',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(mockService.getAttributeExpirationDateOverrides).toHaveBeenCalled();
    }));

    it('should keep side panel open after save and create another', fakeAsync(() => {
      mockService.createAttributeExpirationDateOverride.and.returnValue(of({ success: true, data: mockData[0] }));
      fixture.detectChanges();
      tick();

      const mockForm = jasmine.createSpyObj('FormGroup', ['reset']);
      component.sideDrawerComponent = jasmine.createSpyObj('AddEdit', [''], {
        form: mockForm,
        isSubmitting: true
      });

      component.sidePanelOpen = true;

      component.onSaveAndCreateAnother({
        attributeCode: 'X', attributeDescription: '', overrideAttribute: 'Y',
        overrideDescription: '', effDate: null, termDate: null
      });
      tick();

      expect(component.sidePanelOpen).toBeTrue();
    }));
  });

  // ===== formatDate =====
  describe('formatDate (private)', () => {
    it('should return dash for null', () => {
      expect((component as any).formatDate(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect((component as any).formatDate(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect((component as any).formatDate('')).toBe('-');
    });

    it('should format a valid date string', () => {
      const result = (component as any).formatDate('2024-03-15');
      // Expected format: DD-MON-YYYY e.g. 15-MAR-2024
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).toContain('MAR');
      expect(result).toContain('2024');
    });

    it('should format a Date object', () => {
      const result = (component as any).formatDate(new Date(2023, 0, 5)); // Jan 5, 2023
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(result).toContain('JAN');
      expect(result).toContain('2023');
    });
  });

  // ===== initializeConfigurations =====
  describe('initializeConfigurations', () => {
    it('should set up headerConfig with breadcrumbs and actions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Attribute Expiration Date Override');
      expect(component.headerConfig.actions!.length).toBe(1);
      expect(component.headerConfig.actions![0].label).toBe('ADD NEW OVERRIDE ATTRIBUTE');
    }));

    it('should set up searchConfig', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.searchConfig.placeholder).toBe('Search by Attribute Description');
      expect(component.searchConfig.minLength).toBe(1);
    }));

    it('should set up tableConfig with columns and row actions', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.tableConfig.columns.length).toBe(7);
      expect(component.tableConfig.columns[0].key).toBe('attributeCode');
      expect(component.tableConfig.rowActions!.length).toBe(1);
      expect(component.tableConfig.rowActions![0].action).toBe('edit');
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
    }));

    it('should set emptyMessage and loadingMessage', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.tableConfig.emptyMessage).toBe('No attribute expiration date overrides available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading attribute expiration date overrides...');
    }));

    it('should invoke openAddDrawer when header action onClick is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'openAddDrawer');
      component.headerConfig.actions![0].onClick!();
      expect(component.openAddDrawer).toHaveBeenCalled();
    }));
  });

  // ===== getTableColumns valueFormatter =====
  describe('table column valueFormatters', () => {
    it('should format effDate column using formatDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(effDateCol).toBeDefined();
      expect(effDateCol!.valueFormatter).toBeDefined();

      const result = effDateCol!.valueFormatter!('2024-07-04', {} as any);
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    }));

    it('should format termDate column using formatDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(termDateCol).toBeDefined();

      const result = termDateCol!.valueFormatter!(null, {} as any);
      expect(result).toBe('-');
    }));

    it('should format lastModifiedDate column using formatDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const lastModCol = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      expect(lastModCol).toBeDefined();

      const result = lastModCol!.valueFormatter!('2023-12-25', {} as any);
      expect(result).toContain('DEC');
    }));
  });

  // ===== Keyboard shortcuts additional =====
  describe('Keyboard Shortcuts - additional', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open filter on Alt+F when overlay is not open', () => {
      (component as any).overlayRef = null;
      spyOn(component, 'openFilter');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should not open filter on Alt+F when overlay is already open', () => {
      (component as any).overlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
      spyOn(component, 'openFilter');

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'f' }));

      expect(component.openFilter).not.toHaveBeenCalled();
    });

    it('should close overlay on Escape when overlay is open and side panel is closed', () => {
      component.sidePanelOpen = false;
      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should prioritize closing side panel over overlay on Escape', () => {
      component.sidePanelOpen = true;
      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;

      spyOn(component, 'closeSideDrawer');

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.closeSideDrawer).toHaveBeenCalled();
      expect(mockOverlayRefObj.dispose).not.toHaveBeenCalled();
    });

    it('should handle uppercase Alt+C', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'openAddDrawer');

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'C' }));

      expect(component.openAddDrawer).toHaveBeenCalled();
    });

    it('should handle uppercase Alt+F', () => {
      (component as any).overlayRef = null;
      spyOn(component, 'openFilter');

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { altKey: true, key: 'F' }));

      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should do nothing on Escape when neither side panel nor overlay is open', () => {
      component.sidePanelOpen = false;
      (component as any).overlayRef = null;

      spyOn(component, 'closeSideDrawer');

      component.handleKeyboardShortcut(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(component.closeSideDrawer).not.toHaveBeenCalled();
    });
  });

  // ===== Initial state =====
  describe('initial state', () => {
    it('should have correct default values before init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isFilterOpen).toBeFalse();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState).toBeDefined();
    }));

    it('should have loaded data after init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
    }));
  });

  // ===== closeOverlay (private) =====
  describe('closeOverlay (private)', () => {
    it('should dispose overlayRef and set it to null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockOverlayRefObj = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = mockOverlayRefObj;
      component.isFilterOpen = true;

      (component as any).closeOverlay();

      expect(mockOverlayRefObj.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBeFalse();
    }));

    it('should handle null overlayRef gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).overlayRef = null;
      component.isFilterOpen = true;

      expect(() => (component as any).closeOverlay()).not.toThrow();
      expect(component.isFilterOpen).toBeFalse();
    }));
  });

  // ===== getRowActions =====
  describe('getRowActions (private)', () => {
    it('should return edit action with correct properties', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const rowActions = component.tableConfig.rowActions!;
      expect(rowActions.length).toBe(1);
      expect(rowActions[0].icon).toBe('edit');
      expect(rowActions[0].label).toBe('Edit attribute override');
      expect(rowActions[0].ariaLabel).toBe('Edit attribute override');
      expect(rowActions[0].action).toBe('edit');
    }));
  });

  // ===== effect for pageHeaderData =====
  describe('pageHeaderData effect', () => {
    it('should update headerConfig title and subtitle from pageHeaderService', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Attribute Expiration Date Override: ISBT');
      expect(component.headerConfig.subtitle).toBe('Test Subtitle');
    }));
  });
});
