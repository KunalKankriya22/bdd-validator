import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, Input, signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { ViewCommunicationTypeCodesComponent } from './view-communication-type-codes';
import {
  CommunicationTypesService,
  CommunicationRecord,
} from '../../services/communication-types.service';
import { SnackbarService } from '../../../../../shared/services/snackbar.service';
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

describe('ViewCommunicationTypeCodesComponent', () => {
  let component: ViewCommunicationTypeCodesComponent;
  let fixture: ComponentFixture<ViewCommunicationTypeCodesComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let serviceSpy: jasmine.SpyObj<CommunicationTypesService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const chapterChanged$ = new Subject<void>();
  const routeParams$ = new Subject<any>();

  const mockRecords: CommunicationRecord[] = [
    {
      commType: 'EMAIL',
      commCode: 'CONF',
      description: 'Confirmation',
      targetDays: 7,
      effDate: '2024-01-01',
      termDate: null,
    },
    {
      commType: 'EMAIL',
      commCode: 'REMI',
      description: 'Reminder',
      targetDays: 3,
      effDate: '2024-01-01',
      termDate: '2024-12-31',
    },
  ];

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    routerSpy.getCurrentNavigation.and.returnValue(null);
    serviceSpy = jasmine.createSpyObj('CommunicationTypesService', ['search', 'create', 'update']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal('UTC'),
    });

    serviceSpy.search.and.returnValue(of({ data: mockRecords, totalCount: 2 }));

    await TestBed.configureTestingModule({
      imports: [ViewCommunicationTypeCodesComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: routeParams$.asObservable() } },
        { provide: CommunicationTypesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(null) } },
      ],
    })
      .overrideComponent(ViewCommunicationTypeCodesComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: {
          imports: [MockPageHeaderComponent],
          providers: [{ provide: MatDialog, useValue: dialogSpy }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ViewCommunicationTypeCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load codes when route param is set', fakeAsync(() => {
    routeParams$.next({ codeType: 'EMAIL' });
    tick();
    expect(component.codeTypeParam).toBe('EMAIL');
    expect(serviceSpy.search).toHaveBeenCalledWith('EMAIL', 25, 0, jasmine.any(Object));
    expect(component.filteredCodes.length).toBe(2);
  }));

  it('should set isLoading to false after data loads', fakeAsync(() => {
    routeParams$.next({ codeType: 'EMAIL' });
    tick();
    expect(component.isLoading).toBeFalse();
  }));

  it('should set isLoading to false on error', fakeAsync(() => {
    serviceSpy.search.and.returnValue(throwError(() => new Error('fail')));
    component.codeTypeParam = 'EMAIL';
    component.loadCodes();
    tick();
    expect(component.isLoading).toBeFalse();
  }));

  describe('Search', () => {
    it('should reset pageIndex and load codes on search', fakeAsync(() => {
      component.codeTypeParam = 'EMAIL';
      component.pageIndex = 3;
      component.onSearch('test');
      tick();
      expect(component.searchTerm).toBe('test');
      expect(component.pageIndex).toBe(0);
      expect(serviceSpy.search).toHaveBeenCalled();
    }));
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
    it('should update page size and index on page change', fakeAsync(() => {
      component.codeTypeParam = 'EMAIL';
      component.onPageChange({ pageSize: 50, pageIndex: 2, length: 100 });
      tick();
      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
      expect(serviceSpy.search).toHaveBeenCalled();
    }));
  });

  describe('Add New (onAddNew)', () => {
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
    let saveSubject: Subject<any>;

    beforeEach(() => {
      component.codeTypeParam = 'EMAIL';
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
      serviceSpy.create.and.returnValue(of({ data: mockRecords[0], message: 'Code created successfully', statusCode: 201, success: true }));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Code created successfully');
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should reset form and keep dialog open on addAnother', fakeAsync(() => {
      serviceSpy.create.and.returnValue(of({ data: mockRecords[0], message: 'Code created successfully', statusCode: 201, success: true }));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: true });
      tick();

      expect(mockDialogRef.componentInstance.resetFormForAddAnother).toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Code created successfully');
    }));

    it('should show error with errorCode format on create failure', fakeAsync(() => {
      serviceSpy.create.and.returnValue(throwError(() => ({
        error: { errorCode: '0319', error: 'Duplicate entry not allowed' },
      })));
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
      serviceSpy.create.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '0320', error: 'Validation failed' } },
      })));
      component.onAddNew();

      saveSubject.next({ commCode: 'TEST', description: 'Test', effDate: '2024-01-01', addAnother: false });
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error 0320: Validation failed');
    }));

    it('should not add when codeTypeParam is empty', () => {
      component.codeTypeParam = '';
      component.onAddNew();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Edit (onEdit)', () => {
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;
    let saveSubject: Subject<any>;

    beforeEach(() => {
      component.codeTypeParam = 'EMAIL';
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
      serviceSpy.update.and.returnValue(of({ data: mockRecords[0], message: 'Code updated successfully', statusCode: 200, success: true }));
      component.onEdit(mockRecords[0]);

      saveSubject.next({ commCode: 'CONF', description: 'Updated', effDate: '2024-01-01' });
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Code updated successfully');
      expect(mockDialogRef.close).toHaveBeenCalled();
    }));

    it('should show error with errorCode format on update failure', fakeAsync(() => {
      serviceSpy.update.and.returnValue(throwError(() => ({
        error: { errorCode: '0319', error: 'Duplicate entry not allowed' },
      })));
      component.onEdit(mockRecords[0]);

      saveSubject.next({ commCode: 'CONF', description: 'Updated', effDate: '2024-01-01' });
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
    it('should navigate back to define communication types', () => {
      component.onBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/donor-functions/donor-communication/define-communication-types']);
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
  });

  describe('Filters', () => {
    it('should clear all filters', fakeAsync(() => {
      component.codeTypeParam = 'EMAIL';
      component.searchTerm = 'test';
      component.pageIndex = 3;
      component.sortDirection = 'ASC';
      component.clearFilters();
      tick();

      expect(component.searchTerm).toBe('');
      expect(component.pageIndex).toBe(0);
      expect(component.sortDirection).toBe('');
      expect(component.filterChips.length).toBe(0);
    }));
  });

  describe('Chapter Changes', () => {
    it('should clear filters on chapter change', fakeAsync(() => {
      component.codeTypeParam = 'EMAIL';
      chapterChanged$.next();
      tick();
      expect(component.searchTerm).toBe('');
    }));
  });
});
