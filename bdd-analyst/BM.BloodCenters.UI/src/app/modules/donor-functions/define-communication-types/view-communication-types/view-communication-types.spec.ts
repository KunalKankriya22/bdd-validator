import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Component, Input, signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { ViewCommunicationTypesComponent } from './view-communication-types';
import {
  CommunicationTypesService,
  CommunicationRecord,
} from '../services/communication-types.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';

@Component({
  selector: 'app-page-header-with-breadcrumb',
  standalone: true,
  template: '<div></div>',
})
class MockPageHeaderComponent {
  @Input() config: any;
}

describe('ViewCommunicationTypesComponent', () => {
  let component: ViewCommunicationTypesComponent;
  let fixture: ComponentFixture<ViewCommunicationTypesComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceSpy: jasmine.SpyObj<CommunicationTypesService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const chapterChanged$ = new Subject<void>();

  const mockRecords: CommunicationRecord[] = [
    {
      commType: 'COMTP',
      commCode: 'EMAIL',
      description: 'Email Communication',
      targetDays: 30,
      effDate: '2024-01-01',
      termDate: null,
    },
    {
      commType: 'COMTP',
      commCode: 'PHONE',
      description: 'Phone Communication',
      targetDays: 14,
      effDate: '2024-01-01',
      termDate: '2024-12-31',
    },
  ];

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    serviceSpy = jasmine.createSpyObj('CommunicationTypesService', ['search', 'create', 'update']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('UTC'),
    });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal(null),
    });

    serviceSpy.search.and.returnValue(of({ data: mockRecords, totalCount: 2 }));

    await TestBed.configureTestingModule({
      imports: [ViewCommunicationTypesComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: CommunicationTypesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    })
      .overrideComponent(ViewCommunicationTypesComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: {
          imports: [MockPageHeaderComponent],
          providers: [{ provide: MatDialog, useValue: dialogSpy }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ViewCommunicationTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(serviceSpy.search).toHaveBeenCalledWith('COMTP', 25, 0, jasmine.any(Object));
    expect(component.filteredTypes.length).toBe(2);
    expect(component.totalRecords).toBe(2);
  });

  it('should set isLoading to false after data loads', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should set isLoading to false on error', fakeAsync(() => {
    serviceSpy.search.and.returnValue(throwError(() => new Error('fail')));
    component.loadData();
    tick();
    expect(component.isLoading).toBeFalse();
  }));

  describe('Search', () => {
    it('should reset pageIndex and load data on search', () => {
      component.pageIndex = 3;
      component.onSearch('test');
      expect(component.searchTerm).toBe('test');
      expect(component.pageIndex).toBe(0);
      expect(serviceSpy.search).toHaveBeenCalled();
    });
  });

  describe('Sort', () => {
    it('should cycle through sort directions', () => {
      component.onSort();
      expect(component.sortDirection).toBe('ASC');
      expect(component.getSortIcon()).toBe('arrow_upward');

      component.onSort();
      expect(component.sortDirection).toBe('DESC');
      expect(component.getSortIcon()).toBe('arrow_downward');

      component.onSort();
      expect(component.sortDirection).toBe('');
      expect(component.getSortIcon()).toBe('unfold_more');
    });
  });

  describe('Pagination', () => {
    it('should update page size and index on page change', () => {
      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 });
      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
      expect(serviceSpy.search).toHaveBeenCalled();
    });
  });

  describe('Add New (onAddNew)', () => {
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
    let saveSubject: Subject<any>;

    beforeEach(() => {
      saveSubject = new Subject();
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'], {
        componentInstance: {
          saveRequest: saveSubject,
          isSaving: false,
          resetFormForAddAnother: jasmine.createSpy('resetFormForAddAnother'),
        },
        afterClosed: () => of(undefined),
      });
      dialogSpy.open.and.returnValue(mockDialogRef);
    });

    it('should show success message from backend response', fakeAsync(() => {
      serviceSpy.create.and.returnValue(of({ data: mockRecords[0], message: 'Record created successfully', statusCode: 201, success: true }));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record created successfully');
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should reset form and keep dialog open on addAnother', fakeAsync(() => {
      serviceSpy.create.and.returnValue(of({ data: mockRecords[0], message: 'Record created successfully', statusCode: 201, success: true }));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: true });
      tick();

      expect(mockDialogRef.componentInstance.resetFormForAddAnother).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record created successfully');
    }));

    it('should show error with errorCode format on create failure', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorCode: '0319',
          error: 'Duplicate entry not allowed',
        },
      };
      serviceSpy.create.and.returnValue(throwError(() => ({ error: errorResponse.error })));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 0319: Duplicate entry not allowed');
    }));

    it('should show error text without code when errorCode is absent', fakeAsync(() => {
      serviceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should show errorResponse.error when nested', fakeAsync(() => {
      const errorResponse = {
        error: {
          errorResponse: {
            errorCode: '0320',
            error: 'Validation failed',
          },
        },
      };
      serviceSpy.create.and.returnValue(throwError(() => ({ error: errorResponse.error })));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 0320: Validation failed');
    }));
  });

  describe('Edit (onEdit)', () => {
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
    let saveSubject: Subject<any>;

    beforeEach(() => {
      saveSubject = new Subject();
      mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close'], {
        componentInstance: {
          saveRequest: saveSubject,
          isSaving: false,
        },
        afterClosed: () => of(undefined),
      });
      dialogSpy.open.and.returnValue(mockDialogRef);
    });

    it('should show success message from backend response on update', fakeAsync(() => {
      serviceSpy.update.and.returnValue(of({ data: mockRecords[0], message: 'Record updated successfully', statusCode: 200, success: true }));
      component.onEdit(mockRecords[0]);

      saveSubject.next({ commCode: 'EMAIL', description: 'Updated', effDate: '2024-01-01' });
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record updated successfully');
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should show error with errorCode format on update failure', fakeAsync(() => {
      serviceSpy.update.and.returnValue(throwError(() => ({
        error: { errorCode: '0319', error: 'Duplicate entry not allowed' },
      })));
      component.onEdit(mockRecords[0]);

      saveSubject.next({ commCode: 'EMAIL', description: 'Updated', effDate: '2024-01-01' });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 0319: Duplicate entry not allowed');
    }));

    it('should highlight the selected row during edit', () => {
      component.selectedRow = mockRecords[0];
      expect(component.isRowHighlighted(mockRecords[0])).toBeTrue();
      expect(component.isRowHighlighted(mockRecords[1])).toBeFalse();
    });
  });

  describe('Navigation', () => {
    it('should navigate to code type codes', () => {
      component.onNavigate(mockRecords[0]);
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/donor-communication/communication-type-codes', 'EMAIL'],
        jasmine.any(Object)
      );
    });
  });

  describe('Formatting', () => {
    it('should return "-" for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return "-" for empty string date', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should format ISO date string with time correctly without timezone shift', () => {
      expect(component.formatDate('2026-07-16T00:00:00')).toBe('16-JUL-2026');
    });

    it('should format termination date without timezone shift', () => {
      expect(component.formatDate('2026-07-30T00:00:00')).toBe('30-JUL-2026');
    });

    it('should format December date correctly', () => {
      expect(component.formatDate('2024-12-31T00:00:00')).toBe('31-DEC-2024');
    });

    it('should format January date correctly', () => {
      expect(component.formatDate('2024-01-01T00:00:00')).toBe('01-JAN-2024');
    });

    it('should return "active" for null termDate', () => {
      expect(component.getStatusClass(null)).toBe('active');
    });
  });

  describe('Filters', () => {
    it('should clear all filters', () => {
      component.searchTerm = 'test';
      component.pageIndex = 3;
      component.sortDirection = 'ASC';
      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.pageIndex).toBe(0);
      expect(component.sortDirection).toBe('');
      expect(component.filterChips.length).toBe(0);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear filters and reload on chapter change', fakeAsync(() => {
      spyOn(component, 'loadData');
      chapterChanged$.next();
      tick();
      expect(component.searchTerm).toBe('');
      expect(component.loadData).toHaveBeenCalled();
    }));
  });
});
