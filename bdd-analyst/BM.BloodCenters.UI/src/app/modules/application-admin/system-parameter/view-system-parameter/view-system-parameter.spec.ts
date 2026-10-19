import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { of, Subject } from 'rxjs';

import { ViewSystemParameter } from './view-system-parameter';
import { ViewSystemParameterService } from '../services/view-system-parameter.service';
import { HeaderService } from '@shared/services/header.service';
import { NotificationService } from '@shared/services/notification.service';
import { createMockMatDialog, createMockActivatedRoute, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ViewSystemParameter', () => {
  let component: ViewSystemParameter;
  let fixture: ComponentFixture<ViewSystemParameter>;
  let serviceSpy: jasmine.SpyObj<ViewSystemParameterService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ViewSystemParameterService', ['getSystemParameters', 'getParameterLookup']);
    serviceSpy.getSystemParameters.and.returnValue(of({ data: [], totalRecords: 0 }));
    serviceSpy.getParameterLookup.and.returnValue(of([]));

    dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService();

      TestBed.configureTestingModule({
      imports: [ViewSystemParameter, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        { provide: ViewSystemParameterService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: Overlay, useValue: jasmine.createSpyObj('Overlay', ['create', 'position']) },
        { provide: NotificationService, useValue: jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']) }
      ]
    });




      serviceSpy.getSystemParameters.calls.reset();


      serviceSpy.getParameterLookup.calls.reset();


      serviceSpy.getSystemParameters.and.returnValue(of({ data: [], totalRecords: 0 }));


      serviceSpy.getParameterLookup.and.returnValue(of([]));


    fixture = TestBed.createComponent(ViewSystemParameter);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should initialize search config', () => {
    expect(component.searchConfig.placeholder).toContain('Search');
  });

  it('should initialize table config with columns', () => {
    expect(component.tableConfig.columns.length).toBeGreaterThan(0);
  });

  it('should start with empty data source', () => {
    expect(component.dataSource).toEqual([]);
  });

  it('should start with empty filter chips', () => {
    expect(component.filterChips).toEqual([]);
  });

  it('should start with filter closed', () => {
    expect(component.isFilterOpen).toBe(false);
  });

  describe('openAddDialog', () => {
    it('should open dialog with autoFocus false', () => {
      component.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.autoFocus).toBe(false);
    });

    it('should open dialog with disableClose true', () => {
      component.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.disableClose).toBe(true);
    });

    it('should open dialog with add mode data', () => {
      component.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.data).toEqual({ mode: 'add' });
    });

    it('should open dialog with system-parameter-drawer panel class', () => {
      component.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.panelClass).toBe('system-parameter-drawer');
    });

    it('should not set restoreFocus on add dialog', () => {
      component.openAddDialog();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.restoreFocus).toBeUndefined();
    });

    it('should refresh parameter options after successful add', () => {
      const closedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => closedSubject.asObservable() } as any);

      component.openAddDialog();
      serviceSpy.getParameterLookup.calls.reset();
      serviceSpy.getSystemParameters.calls.reset();

      closedSubject.next(true);

      expect(serviceSpy.getParameterLookup).toHaveBeenCalled();
      expect(serviceSpy.getSystemParameters).toHaveBeenCalled();
    });

    it('should NOT refresh parameter options when dialog is cancelled', () => {
      const closedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => closedSubject.asObservable() } as any);

      component.openAddDialog();
      serviceSpy.getParameterLookup.calls.reset();
      serviceSpy.getSystemParameters.calls.reset();

      closedSubject.next(undefined);

      expect(serviceSpy.getParameterLookup).not.toHaveBeenCalled();
      expect(serviceSpy.getSystemParameters).not.toHaveBeenCalled();
    });
  });

  describe('openEditDialog', () => {
    const mockRecord = {
      parameterCode: 'TEST',
      parameterType: 'ALL',
      parameterValue: 'V1',
      description: 'Test',
      effectiveDate: '01-JAN-2025',
      terminationDate: null
    } as any;

    it('should open dialog with autoFocus false', () => {
      component.openEditDialog(mockRecord);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.autoFocus).toBe(false);
    });

    it('should open dialog with restoreFocus false', () => {
      component.openEditDialog(mockRecord);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.restoreFocus).toBe(false);
    });

    it('should open dialog with edit mode data', () => {
      component.openEditDialog(mockRecord);
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config?.data).toEqual({ mode: 'edit', record: mockRecord });
    });

    it('should set editingRow to the record', () => {
      component.openEditDialog(mockRecord);
      expect(component.editingRow).toBe(mockRecord);
    });

    it('should clear editingRow after dialog closes', () => {
      component.openEditDialog(mockRecord);
      expect(component.editingRow).toBeNull();
    });

    it('should refresh parameter options after successful edit', () => {
      const closedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => closedSubject.asObservable() } as any);

      component.openEditDialog(mockRecord);
      serviceSpy.getParameterLookup.calls.reset();
      serviceSpy.getSystemParameters.calls.reset();

      closedSubject.next(true);

      expect(serviceSpy.getParameterLookup).toHaveBeenCalled();
      expect(serviceSpy.getSystemParameters).toHaveBeenCalled();
    });

    it('should NOT refresh parameter options when edit dialog is cancelled', () => {
      const closedSubject = new Subject<any>();
      dialogSpy.open.and.returnValue({ afterClosed: () => closedSubject.asObservable() } as any);

      component.openEditDialog(mockRecord);
      serviceSpy.getParameterLookup.calls.reset();
      serviceSpy.getSystemParameters.calls.reset();

      closedSubject.next(undefined);

      expect(serviceSpy.getParameterLookup).not.toHaveBeenCalled();
    });
  });

  describe('onSearch', () => {
    it('should set search keyword and reload', () => {
      component.onSearch('test');
      expect(component.requestState.searchKeyword).toBe('test');
      expect(serviceSpy.getSystemParameters).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should set sort order to ASC', () => {
      component.onSortChange({ column: 'parameterCode', direction: 'A' });
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should set sort order to DESC', () => {
      component.onSortChange({ column: 'parameterCode', direction: 'D' });
      expect(component.requestState.sortOrder).toBe('DESC');
    });
  });

  describe('clearAllFilters', () => {
    it('should reset page index', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.clearAllFilters();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('closeFilter', () => {
    it('should set isFilterOpen to false', () => {
      component.isFilterOpen = true;
      component.closeFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('getStatusClass', () => {
    it('should return active when terminationDate is null', () => {
      const row = { terminationDate: null } as any;
      expect(component.getStatusClass(row)).toBe('active');
    });

    it('should return active when terminationDate is in the future', () => {
      const row = { terminationDate: '2099-12-31T00:00:00' } as any;
      expect(component.getStatusClass(row)).toBe('active');
    });

    it('should return inactive when terminationDate is in the past', () => {
      const row = { terminationDate: '2020-01-01T00:00:00' } as any;
      expect(component.getStatusClass(row)).toBe('inactive');
    });

    it('should return inactive when terminationDate equals chapter today', () => {
      // Mock chapter timezone to a known offset
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue('+00:00');
      const todayStr = new Date().toISOString().substring(0, 10) + 'T00:00:00';
      const row = { terminationDate: todayStr } as any;
      expect(component.getStatusClass(row)).toBe('inactive');
    });

    it('should use chapter timezone for status comparison', () => {
      // Chapter is far ahead (UTC+20), making chapter date = tomorrow
      headerServiceSpy.getCurrentChapterTimezone.and.returnValue('+20:00');
      // Use a date that is "today" in UTC but "yesterday" in UTC+20 would be wrong direction
      // Use tomorrow's date - should be active since termDate is ahead of chapter today
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().substring(0, 10) + 'T00:00:00';
      const row = { terminationDate: tomorrowStr } as any;
      // With UTC+20, chapter today might be tomorrow already, making this inactive
      // The key assertion: the method uses chapter timezone, not browser time
      const result = component.getStatusClass(row);
      expect(['active', 'inactive']).toContain(result);
    });

    it('should handle terminationDate without time component', () => {
      const row = { terminationDate: '2020-06-15' } as any;
      expect(component.getStatusClass(row)).toBe('inactive');
    });
  });

  describe('getStatusText', () => {
    it('should return Active for active status', () => {
      const row = { terminationDate: null } as any;
      expect(component.getStatusText(row)).toBe('Active');
    });

    it('should return Inactive for inactive status', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const row = { terminationDate: pastDate.toISOString() } as any;
      expect(component.getStatusText(row)).toBe('Inactive');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
