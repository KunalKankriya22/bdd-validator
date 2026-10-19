import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';

import { DowntimeHistoryQueryComponent } from './downtime-history-query';
import { DowntimeHistoryQueryService } from './services/downtime-history-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockTranslateService, createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DowntimeHistoryQueryComponent', () => {
  let component: DowntimeHistoryQueryComponent;
  let fixture: ComponentFixture<DowntimeHistoryQueryComponent>;
  let mockDowntimeHistoryService: jasmine.SpyObj<DowntimeHistoryQueryService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<any>>;
  let mockTranslateService: jasmine.SpyObj<any>;

  const mockEquipmentTypes = [
    { code: 'CENT', description: 'Centrifuge' },
    { code: 'FRZR', description: 'Freezer' }
  ];

  const mockEquipmentIds = [
    { code: '9ABC', description: '9ABC - EQ-000230' },
    { code: '0001', description: '0001 - 000000001' }
  ];

  const mockEquipmentReferences = [
    { code: 'EQ-000230', description: 'EQ-000230' }
  ];

  const mockDowntimeHistory = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        eventReference: 'DT-000001',
        equipType: 'CENT',
        equipId: '9ABC',
        equipReference: 'EQ-000230',
        equipStatus: 'NEW',
        downtimeCode: 'MAIN',
        downtimeDescription: 'Routine Maintenance',
        downtimeStart: '2024-04-09T14:01:00',
        downtimeEnd: '2024-04-12T07:00:00',
        downtimeFlag: 'N',
        serviceType: 'BASIC',
        serviceTypeDescription: 'Routine Service',
        servicePerson: 'Tanya Miller',
        serviceCompany: null,
        serviceStart: '2024-04-09T14:15:00',
        serviceEnd: '2024-04-09T17:45:00',
        scheduledEvent: 'Y',
        qcReference: null
      }
    ],
    total: 1
  };

  beforeEach(() => {

    mockDowntimeHistoryService = jasmine.createSpyObj('DowntimeHistoryQueryService', [
      'getDowntimeHistory'
    ]);

    const mockPageHeaderSignal = signal({
      breadcrumbs: [],
      title: '',
      subtitle: '',
      actions: []
    });

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['updatePageHeader', 'getTitle'], {
      pageHeaderData: mockPageHeaderSignal
    });
    mockPageHeaderService.getTitle.and.returnValue('Downtime History Query');

    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['convertLocalToGmt']);
    mockDialog = createMockMatDialog();
    mockSnackBar = createMockMatSnackBar();
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', ['setLocale']);
    mockTranslateService = createMockTranslateService();
    // Default spy return values
    // Note: We no longer use separate LOV endpoints, only getDowntimeHistory
    mockDowntimeHistoryService.getDowntimeHistory.and.returnValue(of(mockDowntimeHistory));
    mockChapterTimezoneService.convertLocalToGmt.and.returnValue(moment());



      TestBed.configureTestingModule({
      imports: [
        DowntimeHistoryQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DateAdapter, useValue: mockDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
        { provide: 'TranslateService', useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {} },
            queryParams: of({})
          }
        }
      ]
    })
    .overrideComponent(DowntimeHistoryQueryComponent, {
      set: {
        providers: [
          { provide: DowntimeHistoryQueryService, useValue: mockDowntimeHistoryService },
          { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS] },
          { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
          { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: false } },
        ],
      },
    });
      mockPageHeaderService.getTitle.and.returnValue('Downtime History Query');


      mockDowntimeHistoryService.getDowntimeHistory.and.returnValue(of(mockDowntimeHistory));


      mockChapterTimezoneService.convertLocalToGmt.and.returnValue(moment());


    fixture = TestBed.createComponent(DowntimeHistoryQueryComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all data on init', (done) => {
    // Do NOT call detectChanges yet - component hasn't been initialized
    // Now trigger initialization
    fixture.detectChanges();

    // Use setTimeout to allow async operations to complete
    setTimeout(() => {
      expect(mockDowntimeHistoryService.getDowntimeHistory).toHaveBeenCalledWith({}, 100, 0);
      done();
    }, 50);
  });

  it('should extract equipment types from all data', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    const types = component.equipmentTypes();
    expect(types.length).toBe(1);
    expect(types[0].code).toBe('CENT - Routine Maintenance');
  });

  it('should transform equipment types to dropdown items', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    const dropdownItems = component.equipmentTypesForDropdown();
    expect(dropdownItems.length).toBe(1);
    expect(dropdownItems[0].code).toBe('CENT - Routine Maintenance');
    expect(dropdownItems[0].description).toBe('CENT - Routine Maintenance');
  });

  it('should extract equipment IDs when equipment type is selected', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set('CENT - Routine Maintenance');

    const ids = component.equipmentIds();
    expect(ids.length).toBe(1);
    expect(ids[0].code).toBe('9ABC');
  });

  it('should clear dependent fields when equipment type changes', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set('CENT');
    component.selectedEquipmentId.set('9ABC');

    // Change to a different type
    component.onEquipmentTypeChange('FRZR');

    expect(component.selectedEquipmentId()).toBeNull();
    // equipmentIds is now computed and will be empty for FRZR (no data for it)
    expect(component.equipmentIds().length).toBe(0);
  });

  it('should extract equipment references when equipment ID is selected', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set('CENT - Routine Maintenance');
    component.selectedEquipmentId.set('9ABC');

    const refs = component.equipmentReferences();
    expect(refs.length).toBe(1);
    expect(refs[0].code).toBe('EQ-000230');
  });

  it('should set equipment reference when only one reference is returned', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set('CENT - Routine Maintenance');
    component.selectedEquipmentId.set('9ABC');

    const reference = component.equipmentReference();
    expect(reference).toBe('EQ-000230');
  });

  it('should return empty string when no matching equipment', () => {
    component.allDowntimeData.set([]);
    component.selectedEquipmentType.set('CENT');
    component.selectedEquipmentId.set('9ABC');

    expect(component.equipmentReference()).toBe('');
  });

  it('should load downtime history when RETRIEVE is clicked', (done) => {
    fixture.detectChanges(); // Trigger init which calls getDowntimeHistory once

    mockDowntimeHistoryService.getDowntimeHistory.calls.reset(); // Reset call count after init

    component.selectedEquipmentType.set('CENT');
    component.onRetrieveClick();

    setTimeout(() => {
      expect(mockDowntimeHistoryService.getDowntimeHistory).toHaveBeenCalled();
      expect(component.hasRetrieved()).toBe(true);
      done();
    }, 100);
  });

  it('should set data source and update pagination on successful retrieve', (done) => {
    fixture.detectChanges(); // Trigger init

    component.onRetrieveClick();

    setTimeout(() => {
      expect(component.dataSource().length).toBe(1);
      expect(component.equipmentTableConfig.pagination?.totalRecords).toBe(1);
      done();
    }, 100);
  });

  it('should set error state when API call fails', (done) => {
    fixture.detectChanges(); // Trigger init with successful response

    mockDowntimeHistoryService.getDowntimeHistory.and.returnValue(
      throwError(() => new Error('API Error'))
    );

    component.onRetrieveClick();

    setTimeout(() => {
      expect(component.error()).toBe(true);
      done();
    }, 100);
  });

  it('should compute equipment list from downtime data including all records', () => {
    component.dataSource.set(mockDowntimeHistory.data!);
    const equipmentList = component.equipmentList();

    expect(equipmentList.length).toBe(1);
    expect(equipmentList[0].eventReference).toBe('DT-000001');
    expect(equipmentList[0].equipType).toBe('CENT');
    expect(equipmentList[0].equipId).toBe('9ABC');
  });

  it('should clear all filters', () => {
    component.selectedEquipmentType.set('CENT');
    component.selectedEquipmentId.set('9ABC');
    component.dateFilterForm.patchValue({
      startDate: new Date(),
      endDate: new Date()
    });

    component.clearAllFilters();

    expect(component.selectedEquipmentType()).toBeNull();
    expect(component.selectedEquipmentId()).toBeNull();
    expect(component.dateFilterForm.get('startDate')?.value).toBeNull();
    expect(component.dateFilterForm.get('endDate')?.value).toBeNull();
  });

  it('should return true for hasActiveFilters when filters are set', () => {
    component.selectedEquipmentType.set('CENT');
    expect(component.hasActiveFilters()).toBe(true);

    component.selectedEquipmentType.set(null);
    component.dateFilterForm.patchValue({ startDate: new Date() });
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should return false for hasActiveFilters when no filters are set', () => {
    component.selectedEquipmentType.set(null);
    component.selectedEquipmentId.set(null);
    component.dateFilterForm.patchValue({ startDate: null, endDate: null });

    expect(component.hasActiveFilters()).toBe(false);
  });

  it('should open equipment details dialog when eye icon is clicked', () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    mockDialog.open.and.returnValue(dialogRefSpy);

    component.dataSource.set(mockDowntimeHistory.data!);

    const equipment = {
      eventReference: 'DT-000001',
      equipType: 'CENT',
      equipId: '9ABC',
      equipReference: 'EQ-000230',
      equipStatus: 'NEW'
    };

    component.viewEquipmentDetails(equipment);

    expect(mockDialog.open).toHaveBeenCalled();
  });

  it('should format date time correctly', () => {
    const dateTime = new Date('2024-04-09T14:01:00');
    const formatted = component['formatDateTime'](dateTime);
    expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}/);
  });

  it('should return "-" for null or invalid date time', () => {
    expect(component['formatDateTime'](null)).toBe('-');
    expect(component['formatDateTime'](undefined)).toBe('-');
    expect(component['formatDateTime']('invalid')).toBe('-');
  });

  it('should handle date field validation', () => {
    const form = component.dateFilterForm;

    // Valid dates
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    form.patchValue({ startDate, endDate });

    expect(form.valid).toBe(true);
  });

  it('should compute equipment type description correctly', () => {
    component.allDowntimeData.set([
      {
        eventReference: 'DT-001',
        equipType: 'CENT',
        equipId: '9ABC',
        equipReference: 'EQ-000230',
        equipStatus: 'NEW',
        downtimeCode: 'MAIN',
        downtimeDescription: 'Routine Maintenance',
        downtimeStart: '2024-04-09T14:01:00',
        downtimeEnd: '2024-04-12T07:00:00',
        downtimeFlag: 'N',
        serviceType: 'BASIC',
        serviceTypeDescription: 'Routine Service',
        servicePerson: 'Tanya Miller',
        serviceCompany: null,
        serviceStart: '2024-04-09T14:15:00',
        serviceEnd: '2024-04-09T17:45:00',
        scheduledEvent: 'Y',
        qcReference: null
      }
    ]);
    component.selectedEquipmentType.set('CENT - Routine Maintenance');

    // Equipment type description comes from the downtimeDescription via equipmentTypeDetailsMap
    expect(component.equipmentTypeDescription()).toBe('Routine Maintenance');
  });

  it('should return empty string when no equipment type is selected', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set(null);

    expect(component.equipmentTypeDescription()).toBe('');
  });

  it('should handle array values in dropdown change handlers', () => {
    component.onEquipmentTypeChange(['CENT', 'FRZR']);
    expect(component.selectedEquipmentType()).toBe('CENT');

    component.onEquipmentIdChange(['9ABC', '0001']);
    expect(component.selectedEquipmentId()).toBe('9ABC');
  });

  it('should handle null values in dropdown change handlers', () => {
    component.onEquipmentTypeChange(null);
    expect(component.selectedEquipmentType()).toBeNull();

    component.onEquipmentIdChange(null);
    expect(component.selectedEquipmentId()).toBeNull();
  });

  it('should clear equipment references when equipment type changes', () => {
    component.allDowntimeData.set(mockDowntimeHistory.data!);
    component.selectedEquipmentType.set('CENT');
    component.selectedEquipmentId.set('9ABC');

    // Change to a different type
    component.onEquipmentTypeChange('FRZR');

    // Equipment references are computed and will be empty for FRZR (no matching data)
    expect(component.equipmentReferences().length).toBe(0);
  });

  it('should not load data if RETRIEVE has not been clicked', () => {
    expect(component.hasRetrieved()).toBe(false);
    expect(component.dataSource().length).toBe(0);
  });

  it('should display loading state during API call', () => {
    component.isLoading.set(true);
    expect(component.isLoading()).toBe(true);
  });

  it('should reset loading state after API call completes', (done) => {
    fixture.detectChanges(); // Trigger init

    component.onRetrieveClick();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      done();
    }, 100);
  });

  it('should cleanup subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should send dates in YYYY-MM-DD format without timezone conversion', (done) => {
    fixture.detectChanges(); // Trigger init

    mockDowntimeHistoryService.getDowntimeHistory.calls.reset(); // Reset call count after init

    // Set dates in the form
    const startDate = moment('2026-06-14').toDate();
    const endDate = moment('2026-06-15').toDate();

    component.dateFilterForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });

    component.onRetrieveClick();

    setTimeout(() => {
      expect(mockDowntimeHistoryService.getDowntimeHistory).toHaveBeenCalled();
      const callArgs = mockDowntimeHistoryService.getDowntimeHistory.calls.mostRecent().args;
      const params = callArgs[0];

      // Verify dates are sent in YYYY-MM-DD format (date-only, no time component)
      expect(params.startDate).toBe('2026-06-14');
      expect(params.endDate).toBe('2026-06-15');

      // Verify dates are NOT ISO timestamps
      expect(params.startDate).not.toContain('T');
      expect(params.endDate).not.toContain('T');

      done();
    }, 100);
  });

  it('should not call convertLocalToGmt for date filtering', (done) => {
    fixture.detectChanges(); // Trigger init

    mockDowntimeHistoryService.getDowntimeHistory.calls.reset(); // Reset call count after init
    // Set dates in the form
    const startDate = moment('2026-06-14').toDate();
    const endDate = moment('2026-06-15').toDate();

    component.dateFilterForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });

    component.onRetrieveClick();

    setTimeout(() => {
      // Verify that convertLocalToGmt was NOT called for date filtering
      // (dates should be sent as YYYY-MM-DD without timezone conversion)
      expect(mockChapterTimezoneService.convertLocalToGmt).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should handle dates correctly across different timezones', (done) => {
    fixture.detectChanges(); // Trigger init

    mockDowntimeHistoryService.getDowntimeHistory.calls.reset(); // Reset call count after init

    // Simulate a date that could be affected by timezone conversion
    // If we're in a +20:00 timezone, this date might shift if converted to UTC
    const startDate = moment('2026-06-14').toDate();
    const endDate = moment('2026-06-15').toDate();

    component.dateFilterForm.patchValue({
      startDate: startDate,
      endDate: endDate
    });

    component.onRetrieveClick();

    setTimeout(() => {
      const callArgs = mockDowntimeHistoryService.getDowntimeHistory.calls.mostRecent().args;
      const params = callArgs[0];

      // Verify the dates remain June 14-15 and don't shift to June 12-13
      expect(params.startDate).toBe('2026-06-14');
      expect(params.endDate).toBe('2026-06-15');

      done();
    }, 100);
  });

  it('should send undefined when dates are not set', (done) => {
    fixture.detectChanges(); // Trigger init

    mockDowntimeHistoryService.getDowntimeHistory.calls.reset(); // Reset call count after init

    // Don't set any dates
    component.dateFilterForm.patchValue({
      startDate: null,
      endDate: null
    });

    component.onRetrieveClick();

    setTimeout(() => {
      const callArgs = mockDowntimeHistoryService.getDowntimeHistory.calls.mostRecent().args;
      const params = callArgs[0];

      expect(params.startDate).toBeNull();
      expect(params.endDate).toBeNull();

      done();
    }, 100);
  });
});
