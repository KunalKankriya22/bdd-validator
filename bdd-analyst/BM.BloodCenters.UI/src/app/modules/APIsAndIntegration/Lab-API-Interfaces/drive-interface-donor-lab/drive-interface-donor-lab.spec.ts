import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DriveInterfaceDonorLabComponent } from './drive-interface-donor-lab';
import { DriveInterfaceDonorLabApiService } from './services/drive-interface-donor-lab-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DriveInterfaceDonorLabComponent', () => {
  let headerServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let apiServiceSpy: any;
  let component: DriveInterfaceDonorLabComponent;
  let fixture: ComponentFixture<DriveInterfaceDonorLabComponent>;
  let apiService: jasmine.SpyObj<DriveInterfaceDonorLabApiService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('DriveInterfaceDonorLabApiService', [
      'getTransferByOptions',
      'getDrives',
      'startTransfer'
    ]);
    pageHeaderServiceSpy = createMockPageHeaderService();
    headerServiceSpy = createMockHeaderService();

    const activatedRouteStub = {
      snapshot: {
        params: {},
        queryParams: {},
        data: {}
      }
    };



      TestBed.configureTestingModule({
      imports: [
        DriveInterfaceDonorLabComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: DriveInterfaceDonorLabApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    });


    


      apiServiceSpy.getTransferByOptions.calls.reset();


      apiServiceSpy.getDrives.calls.reset();


      apiServiceSpy.startTransfer.calls.reset();


      pageHeaderServiceSpy.pageHeaderData.calls.reset();


      headerServiceSpy.getCurrentChapterTimezone.calls.reset();


    apiService = TestBed.inject(DriveInterfaceDonorLabApiService) as jasmine.SpyObj<DriveInterfaceDonorLabApiService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    // Default mock responses
    apiServiceSpy.getDrives.and.returnValue(of({
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [],
      total: 0
    }));

    // Setup page header service
    pageHeaderServiceSpy.pageHeaderData.and.returnValue({
      title: 'Drive Interface from Donor to Lab',
      subtitle: 'View and transfer donor Visit Data / Drive Information into the Lab System.',
      breadcrumbs: []
    });

    // Setup header service timezone
    fixture = TestBed.createComponent(DriveInterfaceDonorLabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize filter form with default values', () => {
    expect(component.filterForm.value).toEqual({
      filterType: '',
      driveId: '',
      startDate: null,
      endDate: null
    });
  });

  it('should have default transfer by options', () => {
    expect(component.transferByOptions().length).toBe(3);
    expect(component.transferByOptions()[0]).toEqual({ code: 'All', description: 'All Drives' });
    expect(component.transferByOptions()[1]).toEqual({ code: 'Specific', description: 'Specific' });
    expect(component.transferByOptions()[2]).toEqual({ code: 'DateRange', description: 'Date Range' });
  });

  it('should not load drives on init', () => {
    expect(component.drives().length).toBe(0);
  });



  it('should update drives signal when getDrives succeeds', (done) => {
    const mockDrives = [
      { sequence: 1, driveId: 'D001', driveDate: '01-JAN-2024' },
      { sequence: 2, driveId: 'D002', driveDate: '02-JAN-2024' }
    ];

    apiService.getDrives.and.returnValue(of({
      success: true,
      message: 'Success',
      statusCode: 200,
      data: mockDrives,
      total: 2
    }));

    component.loadDrives();

    setTimeout(() => {
      expect(component.drives().length).toBe(2);
      expect(component.drives()).toEqual(mockDrives);
      done();
    }, 100);
  });



  it('should clear filters and reset visibility', () => {
    component.filterForm.patchValue({
      filterType: 'Specific',
      driveId: 'D001',
      startDate: new Date(),
      endDate: new Date()
    });
    component.showSearchField.set(true);

    component.onClearFilters();

    expect(component.filterForm.value).toEqual({
      filterType: '',
      driveId: '',
      startDate: null,
      endDate: null
    });
    expect(component.showSearchField()).toBe(false);
    expect(component.showDateFields()).toBe(false);
    expect(component.drives().length).toBe(0);
  });

  it('should handle error when start transfer fails', fakeAsync(() => {
    spyOn(console, 'error');
    spyOn(console, 'log');
    const mockDrives = [
      { sequence: 1, driveId: 'D001', driveDate: '01-JAN-2024' }
    ];
    component.drives.set(mockDrives);

    apiService.startTransfer.and.returnValue(throwError(() => ({
      error: { message: 'Transfer failed' }
    })));

    spyOn(component['snackBar'], 'open');

    component.onStartTransfer();
    tick();

    // catchError catches the error, complete handler runs, then resets to idle
    // The snackbar is shown with the failure message before resetting
    expect(component['snackBar'].open).toHaveBeenCalledWith(
      'D001 drive failed to transfer to Lab System.',
      'DISMISS',
      jasmine.any(Object)
    );
    // After complete, transferStatus resets to idle
    expect(component.transferStatus().status).toBe('idle');
  }));

  it('should show error when trying to transfer with no drives', () => {
    component.drives.set([]);

    spyOn(component['snackBar'], 'open');
    component.onStartTransfer();

    expect(component['snackBar'].open).toHaveBeenCalledWith(
      'No drives available to transfer',
      'Close',
      jasmine.any(Object)
    );
  });















  it('should handle "All Drives" selection and load drives immediately', () => {
    apiService.getDrives.calls.reset();

    component.onTransferByChange('All');

    expect(component.showSearchField()).toBe(false);
    expect(component.showDateFields()).toBe(false);
    expect(apiService.getDrives).toHaveBeenCalled();
  });

  it('should handle "Specific" selection and show Drive ID field without loading', () => {
    apiService.getDrives.calls.reset();

    component.onTransferByChange('Specific');

    expect(component.showSearchField()).toBe(true);
    expect(component.showDateFields()).toBe(false);
    expect(component.drives().length).toBe(0);
    expect(component.filterForm.get('driveId')?.value).toBe('');
    expect(apiService.getDrives).not.toHaveBeenCalled();
  });







  it('should handle "Date Range" selection and show date fields without loading', () => {
    apiService.getDrives.calls.reset();

    component.onTransferByChange('DateRange');

    expect(component.showSearchField()).toBe(false);
    expect(component.showDateFields()).toBe(true);
    expect(component.drives().length).toBe(0);
    expect(apiService.getDrives).not.toHaveBeenCalled();
  });

  it('should load drives only when both dates are selected', () => {
    apiService.getDrives.calls.reset();

    component.onTransferByChange('DateRange');

    // Select only start date
    component.filterForm.patchValue({ startDate: new Date('2024-01-01') });
    component.onDateChange('start');
    expect(apiService.getDrives).not.toHaveBeenCalled();

    // Now select end date - should trigger API call
    component.filterForm.patchValue({ endDate: new Date('2024-01-31') });
    component.onDateChange('end');
    expect(apiService.getDrives).toHaveBeenCalled();
  });



  it('should include sortSequence in filters', () => {
    component.currentSort.set({ column: 'sequence', direction: 'D' });
    const filters = component['getFilters']();

    expect(filters.sortSequence).toBe('D');
  });











  it('should reset form and clear drives after successful transfer', fakeAsync(() => {
    spyOn(console, 'log');
    const mockResponse = {
      success: true,
      message: 'Transfer completed successfully',
      processStartTime: '2024-01-01T10:00:00Z',
      processEndTime: '2024-01-01T10:05:00Z'
    };

    const mockDrives = [
      { sequence: 1, driveId: 'D001', driveDate: '01-JAN-2024' }
    ];
    component.drives.set(mockDrives);

    apiService.startTransfer.and.returnValue(of(mockResponse));

    component.onStartTransfer();

    tick();

    // After complete handler, form and drives are reset, status goes back to idle
    expect(component.transferStatus().status).toBe('idle');
    expect(component.drives().length).toBe(0);
    expect(component.filterForm.get('filterType')?.value).toBe('');
    expect(component.showSearchField()).toBe(false);
    expect(component.showDateFields()).toBe(false);
  }));

  it('should handle transfer with non-success response', fakeAsync(() => {
    spyOn(console, 'log');
    const mockResponse = {
      success: false,
      message: 'Transfer failed due to server error',
      processStartTime: '',
      processEndTime: ''
    };

    const mockDrives = [
      { sequence: 1, driveId: 'D001', driveDate: '01-JAN-2024' }
    ];
    component.drives.set(mockDrives);

    apiService.startTransfer.and.returnValue(of(mockResponse));
    spyOn(component['snackBar'], 'open');

    component.onStartTransfer();

    // Process the observable completion
    tick();

    // After complete handler runs, status resets to idle
    // The component doesn't track non-success responses as errors unless they throw
    expect(component.transferStatus().status).toBe('idle');

    // No snackbar should be shown for single drive with no errors
    expect(component['snackBar'].open).not.toHaveBeenCalled();
  }));



  it('should not have readonly attribute on Start Date input', () => {
    component.onTransferByChange('DateRange');
    fixture.detectChanges();

    const startDateInput = fixture.nativeElement.querySelector('input[formcontrolname="startDate"]');
    expect(startDateInput).toBeTruthy();
    expect(startDateInput.hasAttribute('readonly')).toBeFalse();
  });

  it('should not have readonly attribute on End Date input', () => {
    component.onTransferByChange('DateRange');
    fixture.detectChanges();

    const endDateInput = fixture.nativeElement.querySelector('input[formcontrolname="endDate"]');
    expect(endDateInput).toBeTruthy();
    expect(endDateInput.hasAttribute('readonly')).toBeFalse();
  });

  it('should not load drives when end date is prior to start date', () => {
    apiService.getDrives.calls.reset();

    component.onTransferByChange('DateRange');

    component.filterForm.patchValue({
      startDate: new Date('2024-01-31'),
      endDate: new Date('2024-01-01')
    });
    component.onDateChange('end');

    expect(component.filterForm.errors).toEqual({ dateRangeInvalid: true });
    expect(apiService.getDrives).not.toHaveBeenCalled();
  });




});
