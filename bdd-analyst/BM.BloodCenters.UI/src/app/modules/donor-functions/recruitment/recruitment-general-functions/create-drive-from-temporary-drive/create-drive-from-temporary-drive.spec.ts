import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { signal } from '@angular/core';

import { CreateDriveFromTemporaryDriveComponent } from './create-drive-from-temporary-drive';
import { TemporaryDriveService } from './services/temporary-drive.service';
import { HeaderService } from '@shared/services/header.service';
import {
  createMockHeaderService,
  createMockMatDialog,
  createMockMatSnackBar
} from '@shared/testing/common-mocks';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TemporaryDrive } from './models/temporary-drive.model';

describe('CreateDriveFromTemporaryDriveComponent', () => {
  let component: CreateDriveFromTemporaryDriveComponent;
  let fixture: ComponentFixture<CreateDriveFromTemporaryDriveComponent>;
  let mockTemporaryDriveService: jasmine.SpyObj<TemporaryDriveService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockDrives: TemporaryDrive[] = [
    {
      temporaryDriveId: 'TD001',
      sponsorId: 'SP001',
      sponsorName: 'Red Cross Center',
      driveDate: '2026-03-15',
      projectedShow: 50,
      projectedDraw: 40,
      type: 'MOBILE',
      category: 'COMMUNITY',
      contactPerson: 'John Doe'
    },
    {
      temporaryDriveId: 'TD002',
      sponsorId: 'SP002',
      sponsorName: 'City Hospital',
      driveDate: '2026-04-20',
      projectedShow: 30,
      projectedDraw: 25,
      type: 'FIXED',
      category: 'HOSPITAL',
      contactPerson: 'Jane Smith'
    }
  ];

  const mockResponse = {
    data: mockDrives,
    totalRecords: 2
  };

  beforeEach(async () => {
    mockTemporaryDriveService = jasmine.createSpyObj('TemporaryDriveService', [
      'getTemporaryDrives',
      'getTemporaryDriveById'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockDialog = createMockMatDialog();
    mockHeaderService = createMockHeaderService();

    mockTemporaryDriveService.getTemporaryDrives.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [
        CreateDriveFromTemporaryDriveComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TemporaryDriveService, useValue: mockTemporaryDriveService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], { pageHeaderData: signal(undefined) }) },
      ]
    })
    .overrideComponent(CreateDriveFromTemporaryDriveComponent, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDriveFromTemporaryDriveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize header config with correct breadcrumbs and title', () => {
      expect(component.headerConfig.title).toBe('Create Drive from Temporary Drive');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Create Drive from Temporary Drive');
    });

    it('should load temporary drives when chapterId is available', () => {
      expect(mockTemporaryDriveService.getTemporaryDrives).toHaveBeenCalled();
      expect(component.temporaryDrives.length).toBe(2);
      expect(component.filteredDrives.length).toBe(2);
      expect(component.totalRecords).toBe(2);
    });

    it('should set isLoading to false after loading completes', () => {
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('loadTemporaryDrives', () => {
    it('should pass correct pagination parameters to the service', () => {
      component.pageSize = 50;
      component.pageIndex = 2;
      component.currentChapterId = 'TST';

      component.loadTemporaryDrives();

      expect(mockTemporaryDriveService.getTemporaryDrives).toHaveBeenCalledWith(
        50, 100, 'TST', component.currentFilters
      );
    });

    it('should show error snackbar when loading fails', (done) => {
      const error = { error: { message: 'Server error' } };
      mockTemporaryDriveService.getTemporaryDrives.and.returnValue(throwError(() => error));

      component.loadTemporaryDrives();

      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Server error',
          'Close',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        done();
      });
    });

    it('should use fallback message when error has no message', (done) => {
      mockTemporaryDriveService.getTemporaryDrives.and.returnValue(throwError(() => ({})));

      component.loadTemporaryDrives();

      setTimeout(() => {
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          'Failed to load temporary drives',
          'Close',
          jasmine.any(Object)
        );
        done();
      });
    });
  });

  describe('onSearch', () => {
    it('should filter drives by temporaryDriveId (case insensitive)', () => {
      component.temporaryDrives = [...mockDrives];
      component.onSearch('td001');

      expect(component.filteredDrives.length).toBe(1);
      expect(component.filteredDrives[0].temporaryDriveId).toBe('TD001');
    });

    it('should filter drives by sponsorName (case insensitive)', () => {
      component.temporaryDrives = [...mockDrives];
      component.onSearch('hospital');

      expect(component.filteredDrives.length).toBe(1);
      expect(component.filteredDrives[0].sponsorName).toBe('City Hospital');
    });

    it('should reset to all drives when search term is empty', () => {
      component.temporaryDrives = [...mockDrives];
      component.filteredDrives = [];
      component.onSearch('');

      expect(component.filteredDrives.length).toBe(2);
    });

    it('should reset to all drives when search term is whitespace only', () => {
      component.temporaryDrives = [...mockDrives];
      component.filteredDrives = [];
      component.onSearch('   ');

      expect(component.filteredDrives.length).toBe(2);
    });
  });

  describe('onPageChange', () => {
    it('should update pagination state and reload drives', () => {
      const event: PageEvent = { pageSize: 50, pageIndex: 3, length: 200, previousPageIndex: 2 };
      component.onPageChange(event);

      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(3);
      expect(mockTemporaryDriveService.getTemporaryDrives).toHaveBeenCalled();
    });
  });

  describe('row expansion', () => {
    it('should expand a row when toggleRow is called', () => {
      component.toggleRow(0);
      expect(component.isRowExpanded(0)).toBeTrue();
    });

    it('should collapse a row when toggleRow is called on an expanded row', () => {
      component.toggleRow(0);
      component.toggleRow(0);
      expect(component.isRowExpanded(0)).toBeFalse();
    });

    it('should expand all rows when toggleAllRows is called and none expanded', () => {
      component.filteredDrives = [...mockDrives];
      component.allRowsExpanded = false;

      component.toggleAllRows();

      expect(component.isRowExpanded(0)).toBeTrue();
      expect(component.isRowExpanded(1)).toBeTrue();
      expect(component.allRowsExpanded).toBeTrue();
    });

    it('should collapse all rows when toggleAllRows is called and all expanded', () => {
      component.filteredDrives = [...mockDrives];
      component.allRowsExpanded = true;

      component.toggleAllRows();

      expect(component.isRowExpanded(0)).toBeFalse();
      expect(component.isRowExpanded(1)).toBeFalse();
      expect(component.allRowsExpanded).toBeFalse();
    });
  });

  describe('toggleSort', () => {
    it('should toggle sort direction from asc to desc', () => {
      component.sortDirection = 'asc';
      component.filteredDrives = [...mockDrives];

      component.toggleSort();

      expect(component.sortDirection).toBe('desc');
    });

    it('should sort drives by driveDate in descending order', () => {
      component.sortDirection = 'asc';
      component.filteredDrives = [...mockDrives];

      component.toggleSort();

      expect(new Date(component.filteredDrives[0].driveDate).getTime())
        .toBeGreaterThanOrEqual(new Date(component.filteredDrives[1].driveDate).getTime());
    });
  });

  describe('formatDate', () => {
    it('should format date string to DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate('2026-03-15');
      expect(result).toBe('15-MAR-2026');
    });
  });

  describe('onCreateDrive', () => {
    it('should fetch full drive details and show form on success', (done) => {
      const fullDrive = { ...mockDrives[0], location: 'Main Hall' };
      mockTemporaryDriveService.getTemporaryDriveById.and.returnValue(of(fullDrive));

      component.onCreateDrive(mockDrives[0]);

      setTimeout(() => {
        expect(component.selectedDrive).toEqual(fullDrive);
        expect(component.showForm).toBeTrue();
        expect(component.isLoading).toBeFalse();
        expect(component.headerConfig.title).toContain('Edit Drive TD001');
        done();
      });
    });

    it('should fall back to cached drive data and show warning on error', (done) => {
      mockTemporaryDriveService.getTemporaryDriveById.and.returnValue(
        throwError(() => ({ error: { message: 'Not found' } }))
      );

      component.onCreateDrive(mockDrives[0]);

      setTimeout(() => {
        expect(component.selectedDrive).toEqual(mockDrives[0]);
        expect(component.showForm).toBeTrue();
        expect(mockSnackBar.open).toHaveBeenCalledWith(
          jasmine.stringContaining('using cached data'),
          'Close',
          jasmine.any(Object)
        );
        done();
      });
    });
  });

  describe('onCloseForm', () => {
    it('should reset form state and restore list breadcrumbs', () => {
      component.showForm = true;
      component.selectedDrive = mockDrives[0];
      component.isEditingDrive = true;
      component.selectedDriveId = 'TD001';

      component.onCloseForm();

      expect(component.showForm).toBeFalse();
      expect(component.selectedDrive).toBeNull();
      expect(component.isEditingDrive).toBeFalse();
      expect(component.selectedDriveId).toBeNull();
      expect(component.headerConfig.title).toBe('Create Drive from Temporary Drive');
    });
  });

  describe('onSaveSuccess', () => {
    it('should reset form state and reload temporary drives', () => {
      component.showForm = true;
      component.selectedDrive = mockDrives[0];
      const callCountBefore = mockTemporaryDriveService.getTemporaryDrives.calls.count();

      component.onSaveSuccess();

      expect(component.showForm).toBeFalse();
      expect(component.selectedDrive).toBeNull();
      expect(mockTemporaryDriveService.getTemporaryDrives.calls.count()).toBeGreaterThan(callCountBefore);
    });
  });

  describe('applyFilters and clearAllFilters', () => {
    it('should set current filters, reset page index, and reload', () => {
      const filters = { driveDate: null, sponsorId: 'SP001', driveType: null, driveCategory: null };
      component.pageIndex = 5;

      component.applyFilters(filters);

      expect(component.currentFilters).toEqual(filters);
      expect(component.pageIndex).toBe(0);
      expect(mockTemporaryDriveService.getTemporaryDrives).toHaveBeenCalled();
    });

    it('should clear all filters by applying null', () => {
      component.currentFilters = { driveDate: null, sponsorId: 'SP001', driveType: null, driveCategory: null };

      component.clearAllFilters();

      expect(component.currentFilters).toBeNull();
    });
  });
});
