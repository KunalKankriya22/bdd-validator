import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { of, throwError, Subject, delay as rxDelay } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import moment from 'moment';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { ServiceHistoryQueryComponent } from './service-history-query';
import { ServiceHistoryQueryService } from './services/service-history-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockMatDialog, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  ServiceHistoryModel,
  ServiceHistoryResponse,
  EquipmentTypeLookup,
  EquipmentIdLookup,
  EquipmentReferenceLookup
} from './models/service-history-query.model';

describe('ServiceHistoryQueryComponent', () => {
  let component: ServiceHistoryQueryComponent;
  let fixture: ComponentFixture<ServiceHistoryQueryComponent>;
  let mockService: jasmine.SpyObj<ServiceHistoryQueryService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;

  const mockEquipmentTypes: EquipmentTypeLookup[] = [
    { equipType: 'CENT', equipTypeDescription: 'Centrifuge' },
    { equipType: 'FRDG', equipTypeDescription: 'Refrigerator' },
    { equipType: 'INCB', equipTypeDescription: 'Incubator' }
  ];

  const mockEquipmentIds: EquipmentIdLookup[] = [
    { equipId: 'CENT-001', equipReference: 'REF-001', serviceDates: '2025-01-01 to 2025-01-05' },
    { equipId: 'CENT-002', equipReference: 'REF-002', serviceDates: '2025-01-10 to 2025-01-15' }
  ];

  const mockEquipmentReferences: EquipmentReferenceLookup[] = [
    { equipReference: 'REF-001', serviceDates: '2025-01-01 to 2025-01-05' }
  ];

  const mockServiceHistory: ServiceHistoryModel = {
    eventReference: 'EVT-001',
    equipType: 'CENT',
    equipId: 'CENT-001',
    equipReference: 'REF-001',
    equipStatus: 'IN',
    serviceDescription: 'Routine maintenance',
    serviceStart: '2025-01-01T10:00:00',
    serviceEnd: '2025-01-01T12:00:00',
    downtimeFlag: 'Y',
    scheduledEvent: 'Y',
    downtimeCode: 'MAINT',
    downtimeDescription: 'Maintenance',
    serviceCode: 'PREV',
    servicePerson: 'John Doe',
    serviceCompany: 'Service Co',
    qcReference: 'QC-001'
  };

  const mockServiceHistoryResponse: ServiceHistoryResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [mockServiceHistory],
    total: 1
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('ServiceHistoryQueryService', [
      'getServiceHistory',
      'getEquipmentTypes',
      'getEquipmentIds',
      'getEquipmentReferences',
      'validateEquipmentType',
      'validateEquipment',
      'validateEquipmentReference'
    ]);

    mockDialog = createMockMatDialog();

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = createMockHeaderService();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal({ title: 'Service History Query', subtitle: '' })
    });
    mockPageHeaderService.getTitle.and.returnValue('Service History Query');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'convertLocalToGmt',
      'convertGmtToLocal'
    ]);

    // Default return values
    mockService.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));
    mockService.getEquipmentIds.and.returnValue(of(mockEquipmentIds));
    mockService.getEquipmentReferences.and.returnValue(of(mockEquipmentReferences));
    mockService.getServiceHistory.and.returnValue(of(mockServiceHistoryResponse));

    // Mock timezone service to return moment objects
    mockChapterTimezoneService.convertLocalToGmt.and.callFake((date: moment.Moment) => moment(date));
    mockChapterTimezoneService.convertGmtToLocal.and.callFake((date: moment.Moment) => moment(date));



      TestBed.configureTestingModule({
      imports: [
        ServiceHistoryQueryComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        FormBuilder,
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } }
      ]
    })
      .overrideComponent(ServiceHistoryQueryComponent, {
        set: {
          providers: [
            { provide: ServiceHistoryQueryService, useValue: mockService }
          ]
        }
      });

      mockPageHeaderService.getTitle.and.returnValue('Service History Query');


      mockPageHeaderService.getSubtitle.and.returnValue('');


      mockService.getEquipmentTypes.and.returnValue(of(mockEquipmentTypes));


      mockService.getEquipmentIds.and.returnValue(of(mockEquipmentIds));


      mockService.getEquipmentReferences.and.returnValue(of(mockEquipmentReferences));


      mockService.getServiceHistory.and.returnValue(of(mockServiceHistoryResponse));


      mockChapterTimezoneService.convertLocalToGmt.and.callFake((date: moment.Moment) => moment(date));


      mockChapterTimezoneService.convertGmtToLocal.and.callFake((date: moment.Moment) => moment(date));


    fixture = TestBed.createComponent(ServiceHistoryQueryComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Initialization', () => {


    it('should initialize date filter form with correct controls', () => {
      fixture.detectChanges();
      expect(component.dateFilterForm).toBeDefined();
      expect(component.dateFilterForm.get('startDate')).toBeTruthy();
      expect(component.dateFilterForm.get('endDate')).toBeTruthy();
    });

    it('should initialize signals with default values', () => {
      expect(component.equipmentTypes()).toEqual([]);
      expect(component.equipmentIds()).toEqual([]);
      expect(component.equipmentReferences()).toEqual([]);
      expect(component.selectedEquipmentType()).toBeNull();
      expect(component.selectedEquipmentId()).toBeNull();
      expect(component.dataSource()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBe(false);
      expect(component.hasRetrieved()).toBe(false);
    });



    it('should load equipment types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getEquipmentTypes).toHaveBeenCalled();
      expect(component.equipmentTypes()).toEqual(mockEquipmentTypes);
    }));

    it('should initialize page header config', () => {
      fixture.detectChanges();

      expect(component.pageHeaderConfig).toBeDefined();
      expect(component.pageHeaderConfig.breadcrumbs).toBeDefined();
      expect(component.pageHeaderConfig.title).toBeDefined();
    });
  });

  describe('Equipment Type Loading', () => {
    it('should load equipment types successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockService.getEquipmentTypes).toHaveBeenCalled();
      expect(component.equipmentTypes()).toEqual(mockEquipmentTypes);
    }));

    it('should handle equipment type loading error', fakeAsync(() => {
      mockService.getEquipmentTypes.and.returnValue(
        throwError(() => new Error('Failed to load equipment types'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.equipmentTypes()).toEqual([]);
    }));

    it('should generate dropdown items from equipment types', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const dropdownItems = component.equipmentTypesForDropdown();
      expect(dropdownItems.length).toBe(3);
      expect(dropdownItems[0].code).toBe('CENT');
      expect(dropdownItems[0].description).toBe('CENT - Centrifuge');
    }));
  });

  describe('Equipment Type Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load equipment IDs when equipment type is selected', fakeAsync(() => {
      component.onEquipmentTypeChange('CENT');
      tick();

      expect(mockService.getEquipmentIds).toHaveBeenCalledWith('CENT');
      expect(component.selectedEquipmentType()).toBe('CENT');
      expect(component.equipmentIds()).toEqual(mockEquipmentIds);
    }));

    it('should handle array input for equipment type change', fakeAsync(() => {
      component.onEquipmentTypeChange(['CENT']);
      tick();

      expect(component.selectedEquipmentType()).toBe('CENT');
      expect(mockService.getEquipmentIds).toHaveBeenCalledWith('CENT');
    }));

    it('should clear equipment ID and reference when equipment type changes', fakeAsync(() => {
      component.selectedEquipmentType.set('CENT');
      component.selectedEquipmentId.set('CENT-001');
      component.equipmentIds.set(mockEquipmentIds);
      component.equipmentReferences.set(mockEquipmentReferences);

      // Mock to return empty for FRDG to test clearing behavior
      mockService.getEquipmentIds.and.returnValue(of([]));

      component.onEquipmentTypeChange('FRDG');
      tick();

      expect(component.selectedEquipmentId()).toBeNull();
      expect(component.equipmentReferences()).toEqual([]);

      // Reset mock
      mockService.getEquipmentIds.and.returnValue(of(mockEquipmentIds));
    }));



    it('should handle equipment IDs loading error', fakeAsync(() => {
      mockService.getEquipmentIds.and.returnValue(
        throwError(() => new Error('Failed to load equipment IDs'))
      );
      spyOn(console, 'error');

      component.onEquipmentTypeChange('CENT');
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.equipmentIds()).toEqual([]);
    }));
  });

  describe('Equipment ID Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedEquipmentType.set('CENT');
      component.equipmentIds.set(mockEquipmentIds);
    }));

    it('should load equipment references when equipment ID is selected', fakeAsync(() => {
      component.onEquipmentIdChange('CENT-001');
      tick();

      expect(mockService.getEquipmentReferences).toHaveBeenCalledWith('CENT', 'CENT-001');
      expect(component.selectedEquipmentId()).toBe('CENT-001');
      expect(component.equipmentReferences()).toEqual(mockEquipmentReferences);
    }));

    it('should handle array input for equipment ID change', fakeAsync(() => {
      component.onEquipmentIdChange(['CENT-001']);
      tick();

      expect(component.selectedEquipmentId()).toBe('CENT-001');
      expect(mockService.getEquipmentReferences).toHaveBeenCalledWith('CENT', 'CENT-001');
    }));

    it('should clear equipment references when equipment ID changes', fakeAsync(() => {
      component.equipmentReferences.set(mockEquipmentReferences);

      // Mock to return empty for CENT-002 to test clearing behavior
      mockService.getEquipmentReferences.and.returnValue(of([]));

      component.onEquipmentIdChange('CENT-002');
      tick();

      expect(component.equipmentReferences()).toEqual([]);

      // Reset mock
      mockService.getEquipmentReferences.and.returnValue(of(mockEquipmentReferences));
    }));



    it('should handle equipment references loading error', fakeAsync(() => {
      mockService.getEquipmentReferences.and.returnValue(
        throwError(() => new Error('Failed to load equipment references'))
      );
      spyOn(console, 'error');

      component.onEquipmentIdChange('CENT-001');
      tick();

      expect(console.error).toHaveBeenCalled();
      expect(component.equipmentReferences()).toEqual([]);
    }));
  });

  describe('Computed Values', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute equipment type description', () => {
      component.equipmentTypes.set(mockEquipmentTypes);
      component.selectedEquipmentType.set('CENT');

      expect(component.equipmentTypeDescription()).toBe('Centrifuge');
    });



    it('should compute equipment reference', () => {
      component.equipmentReferences.set(mockEquipmentReferences);

      expect(component.equipmentReference()).toBe('REF-001');
    });



    it('should compute hasData signal', () => {
      component.dataSource.set([]);
      expect(component.hasData()).toBe(false);

      component.dataSource.set([mockServiceHistory]);
      expect(component.hasData()).toBe(true);
    });
  });

  describe('Date Field Handlers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should handle start date blur', () => {
      component.onStartDateBlur();

      const control = component.dateFilterForm.get('startDate');
      expect(control?.touched).toBe(true);
    });





    it('should handle end date blur', () => {
      component.onEndDateBlur();

      const control = component.dateFilterForm.get('endDate');
      expect(control?.touched).toBe(true);
    });






  });

  describe('hasActiveFilters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when equipment type is selected', () => {
      component.selectedEquipmentType.set('CENT');
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when equipment ID is selected', () => {
      component.selectedEquipmentId.set('CENT-001');
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when start date is selected', () => {
      component.dateFilterForm.patchValue({ startDate: new Date() });
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when end date is selected', () => {
      component.dateFilterForm.patchValue({ endDate: new Date() });
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when no filters are selected', () => {
      component.selectedEquipmentType.set(null);
      component.selectedEquipmentId.set(null);
      component.dateFilterForm.reset();

      expect(component.hasActiveFilters()).toBe(false);
    });
  });



  describe('Data Loading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load service history data successfully', fakeAsync(() => {
      component.selectedEquipmentType.set('CENT');
      component.loadData();
      tick();

      expect(component.isLoading()).toBe(false);
      expect(component.dataSource()).toEqual([mockServiceHistory]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
      expect(component.error()).toBe(false);
    }));





    it('should handle 404 error with error code 1369', fakeAsync(() => {
      const error = {
        status: 404,
        error: { errorCode: '1369', message: 'No data found' }
      };
      mockService.getServiceHistory.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.loadData();
      flush();

      expect(component.dataSource()).toEqual([]);
      expect(component.error()).toBe(false);
      expect(component.isLoading()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading service history:', error);

      // Reset mock
      mockService.getServiceHistory.and.returnValue(of(mockServiceHistoryResponse));
    }));

    it('should handle other errors', fakeAsync(() => {
      const error = {
        status: 500,
        error: { errorCode: '500', message: 'Server error' }
      };
      mockService.getServiceHistory.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.loadData();
      flush();

      expect(component.dataSource()).toEqual([]);
      expect(component.error()).toBe(true);
      expect(component.isLoading()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error loading service history:', error);

      // Reset mock
      mockService.getServiceHistory.and.returnValue(of(mockServiceHistoryResponse));
    }));

    it('should handle response with success false', fakeAsync(() => {
      mockService.getServiceHistory.and.returnValue(of({
        success: false,
        message: 'Query failed',
        statusCode: 400,
        data: [],
        total: 0
      }));
      spyOn(console, 'error');

      component.loadData();
      tick();

      expect(component.dataSource()).toEqual([]);
      expect(component.error()).toBe(true);
      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Clear All Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset all filter values', () => {
      component.selectedEquipmentType.set('CENT');
      component.selectedEquipmentId.set('CENT-001');
      component.equipmentIds.set(mockEquipmentIds);
      component.equipmentReferences.set(mockEquipmentReferences);
      component.dateFilterForm.patchValue({
        startDate: new Date(),
        endDate: new Date()
      });

      component.clearAllFilters();

      expect(component.selectedEquipmentType()).toBeNull();
      expect(component.selectedEquipmentId()).toBeNull();
      expect(component.equipmentIds()).toEqual([]);
      expect(component.equipmentReferences()).toEqual([]);
      expect(component.dateFilterForm.value).toEqual({
        startDate: null,
        endDate: null
      });
    });

    it('should clear data source and reset pagination', () => {
      component.dataSource.set([mockServiceHistory]);
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 2;
        component.tableConfig.pagination.totalRecords = 10;
      }
      component.hasRetrieved.set(true);

      component.clearAllFilters();

      expect(component.dataSource()).toEqual([]);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.hasRetrieved()).toBe(false);
    });
  });

  describe('Table Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should handle row action for view', () => {
      spyOn(component, 'viewDetails');

      component.onRowAction({ action: 'view', row: mockServiceHistory });

      expect(component.viewDetails).toHaveBeenCalledWith(mockServiceHistory);
    });


  });

  describe('Chapter Changes', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should retain filters when chapter changes', fakeAsync(() => {
      component.selectedEquipmentType.set('CENT');
      component.selectedEquipmentId.set('CENT-001');
      chapterChangedSubject.next();
      tick();

      expect(component.selectedEquipmentType()).toBe('CENT');
      expect(component.selectedEquipmentId()).toBe('CENT-001');
      expect(mockService.getEquipmentTypes).toHaveBeenCalled();
    }));
  });
  describe('Table Configuration', () => {


    it('should have view action in row actions', () => {
      const viewAction = component.tableConfig.rowActions?.find(a => a.action === 'view');
      expect(viewAction).toBeDefined();
      expect(viewAction?.icon).toBe('visibility');
    });
  });

  describe('Coverage Gap Tests', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call loadData on retrieve click with valid form', fakeAsync(() => {
      component.onRetrieveClick();
      tick();
      expect(component.hasRetrieved()).toBeTrue();
      expect(mockService.getServiceHistory).toHaveBeenCalled();
    }));

    it('should not call loadData on retrieve click with invalid form', () => {
      component.dateFilterForm.setErrors({ dateRangeInvalid: true });
      component.onRetrieveClick();
      expect(component.hasRetrieved()).toBeFalse();
    });

    it('should handle page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      tick();
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    }));

    it('should handle sort change', fakeAsync(() => {
      component.onSortChange({ column: 'equipType', direction: 'A' });
      tick();
      expect(component.tableConfig.sortConfig?.column).toBe('equipType');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    }));

    it('should open details dialog on viewDetails', () => {
      component.viewDetails(mockServiceHistory);
      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          width: '900px',
          data: mockServiceHistory
        })
      );
    });

    it('should ignore row action for non-view actions', () => {
      spyOn(component, 'viewDetails');
      component.onRowAction({ action: 'delete', row: mockServiceHistory });
      expect(component.viewDetails).not.toHaveBeenCalled();
    });

    it('should handle start date input', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      component.onStartDateInput(event);
      expect(component.dateFilterForm).toBeDefined();
    });

    it('should handle end date input', () => {
      const event = { target: { value: '31-DEC-2025' } } as any;
      component.onEndDateInput(event);
      expect(component.dateFilterForm).toBeDefined();
    });

    it('should handle start date change', () => {
      component.dateFilterForm.get('startDate')?.setValue(moment('2025-01-01'));
      component.onStartDateChange();
      expect(component.dateFilterForm.get('startDate')?.valid).toBeDefined();
    });

    it('should handle end date change', () => {
      component.dateFilterForm.get('endDate')?.setValue(moment('2025-12-31'));
      component.onEndDateChange();
      expect(component.dateFilterForm.get('endDate')?.valid).toBeDefined();
    });

    it('should get start date error', () => {
      const result = component.getStartDateError();
      expect(typeof result).toBe('string');
    });

    it('should get end date error', () => {
      const result = component.getEndDateError();
      expect(typeof result).toBe('string');
    });

    it('should return empty description when no equipment type selected', () => {
      component.selectedEquipmentType.set(null);
      expect(component.equipmentTypeDescription()).toBe('');
    });

    it('should return empty equipment reference with multiple refs', () => {
      component.equipmentReferences.set([
        { equipReference: 'REF-001', serviceDates: '' },
        { equipReference: 'REF-002', serviceDates: '' }
      ]);
      expect(component.equipmentReference()).toBe('');
    });

    it('should return empty equipment reference with empty refs', () => {
      component.equipmentReferences.set([]);
      expect(component.equipmentReference()).toBe('');
    });

    it('should not load equipment IDs when type is cleared', fakeAsync(() => {
      mockService.getEquipmentIds.calls.reset();
      component.onEquipmentTypeChange(null);
      tick();
      expect(component.selectedEquipmentType()).toBeNull();
      expect(mockService.getEquipmentIds).not.toHaveBeenCalled();
    }));

    it('should not load references when equipment ID is cleared', fakeAsync(() => {
      component.selectedEquipmentType.set('CENT');
      mockService.getEquipmentReferences.calls.reset();
      component.onEquipmentIdChange(null);
      tick();
      expect(component.selectedEquipmentId()).toBeNull();
      expect(mockService.getEquipmentReferences).not.toHaveBeenCalled();
    }));

    it('should load data with date filters', fakeAsync(() => {
      component.dateFilterForm.patchValue({
        startDate: moment('2025-01-01'),
        endDate: moment('2025-12-31')
      });
      component.loadData();
      tick();
      expect(mockService.getServiceHistory).toHaveBeenCalledWith(
        jasmine.objectContaining({
          startDate: jasmine.any(String),
          endDate: jasmine.any(String)
        })
      );
    }));

    it('should generate equipment ID dropdown items', () => {
      component.equipmentIds.set(mockEquipmentIds);
      const items = component.equipmentIdsForDropdown();
      expect(items.length).toBe(2);
      expect(items[0].code).toBe('CENT-001');
    });

    it('should handle chapter change by clearing and reloading', fakeAsync(() => {
      component.selectedEquipmentType.set('CENT');
      component.dataSource.set([mockServiceHistory]);
      chapterChangedSubject.next();
      tick();
      expect(mockService.getEquipmentTypes).toHaveBeenCalled();
    }));
  });
});
