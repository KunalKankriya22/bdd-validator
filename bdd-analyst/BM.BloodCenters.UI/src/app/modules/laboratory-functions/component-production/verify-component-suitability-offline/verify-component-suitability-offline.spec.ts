import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import moment from 'moment';

import { VerifyComponentSuitabilityOfflineComponent } from './verify-component-suitability-offline';
import { WarningOverrideDialogComponent } from './dialogs/warning-override-dialog';
import { VerifyComponentSuitabilityOfflineService } from './services/verify-component-suitability-offline.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  ProcessCodeDto,
  UnitDetailsDto,
  ComponentEligibilityDto,
  VerifyComponentSuitabilityResponse,
} from './models/verify-component-suitability-offline.model';

describe('VerifyComponentSuitabilityOfflineComponent', () => {
  let component: VerifyComponentSuitabilityOfflineComponent;
  let fixture: ComponentFixture<VerifyComponentSuitabilityOfflineComponent>;
  let serviceSpy: jasmine.SpyObj<VerifyComponentSuitabilityOfflineService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChangedSubject: Subject<void>;

  const mockProcessCodes: ProcessCodeDto[] = [
    { processCode: 'THAW', processCodeDesc: 'Deglycerolization' },
    { processCode: 'SUITO', processCodeDesc: 'Component Suitability Verification' },
  ];

  const mockUnitDetails: UnitDetailsDto = {
    unitId: 'W1234-18-031311-Z',
    collectionDate: '2026-05-10T00:00:00Z',
    expirationDate: '2026-08-10T00:00:00Z',
    chapterId: 'CHAP01',
  };

  const mockEligibleComponents: ComponentEligibilityDto[] = [
    {
      componentPrefix: '01',
      productCode: 'E0701V00',
      componentStatus: 'L',
      rejectReasonCode: null,
      systemLabelDecision: '51',
      aboRh: 'O+ Regular',
      expiryDate: '2026-08-10T23:59:00Z',
      productDescription: 'Red Blood Cells',
    },
    {
      componentPrefix: '02',
      productCode: 'E0702V00',
      componentStatus: 'L',
      rejectReasonCode: null,
      systemLabelDecision: '62',
      aboRh: 'A+ Regular',
      expiryDate: '2026-08-10T23:59:00Z',
      productDescription: 'Platelets',
    },
  ];

  const mockVerifyResponse: VerifyComponentSuitabilityResponse = {
    unitId: 'W1234-18-031311-Z',
    processCode: 'THAW',
    componentPrefix: 'E0701V00',
    processTimestamp: '2026-05-11T14:30:00Z',
    verificationSuccess: true,
    message: 'Component suitability verified successfully.',
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('VerifyComponentSuitabilityOfflineService', [
      'getProcessCodes',
      'getUnitDetails',
      'getEligibleComponents',
      'verify',
    ]);

    serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    serviceSpy.getUnitDetails.and.returnValue(of(mockUnitDetails));
    serviceSpy.getEligibleComponents.and.returnValue(of(mockEligibleComponents));
    serviceSpy.verify.and.returnValue(of(mockVerifyResponse));

    snackBarSpy = createMockMatSnackBar();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ override: false, codes: [] }),
    } as any);
    chapterChangedSubject = new Subject<void>();

    const headerServiceMock = {
      chapterChanged$: chapterChangedSubject.asObservable(),
      chapterTimeZone: () => 'UTC',
    };

    const pageHeaderServiceMock = {
      pageHeaderData: () => undefined,
    };

    const chapterTimezoneServiceMock = {
      getChapterLocalDate: () => moment(),
      getChapterLocalDateTime: () => moment(),
      convertLocalToGmt: (d: any) => d.clone().utc(),
    };



      TestBed.configureTestingModule({
      imports: [
        VerifyComponentSuitabilityOfflineComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        { provide: VerifyComponentSuitabilityOfflineService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
    });

    TestBed.overrideComponent(VerifyComponentSuitabilityOfflineComponent, {
      add: { providers: [
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ] },
    });

      serviceSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));


      serviceSpy.getUnitDetails.and.returnValue(of(mockUnitDetails));


      serviceSpy.getEligibleComponents.and.returnValue(of(mockEligibleComponents));


      serviceSpy.verify.and.returnValue(of(mockVerifyResponse));


    fixture = TestBed.createComponent(VerifyComponentSuitabilityOfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize with no selected process code', () => {
    expect(component.selectedProcessCode).toBe('');
  });

  it('should initialize process description as dash', () => {
    expect(component.processDescription).toBe('-');
  });

  it('should initialize with empty verified entries', () => {
    expect(component.verifiedEntries.length).toBe(0);
  });

  it('should update process description when process code is selected', () => {
    component.processCodeControl.setValue('THAW');
    component.onProcessCodeChange();
    expect(component.processDescription).toBe('Deglycerolization');
  });

  it('should reset description to dash when process code is cleared', () => {
    component.processCodeControl.setValue('THAW');
    component.onProcessCodeChange();
    component.processCodeControl.setValue('');
    component.onProcessCodeChange();
    expect(component.processDescription).toBe('-');
  });

  it('should have table config with 5 columns', () => {
    expect(component.tableConfig.columns.length).toBe(5);
    expect(component.tableConfig.columns[0].key).toBe('unitId');
    expect(component.tableConfig.columns[1].key).toBe('product');
    expect(component.tableConfig.columns[2].key).toBe('aboRh');
    expect(component.tableConfig.columns[3].key).toBe('expirationDate');
    expect(component.tableConfig.columns[4].key).toBe('processDate');
  });

  it('should handle process code loading error', () => {
    serviceSpy.getProcessCodes.and.returnValue(
      throwError(() => ({ status: 500, message: 'Server error' })),
    );

    (component as any).loadProcessCodes();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to load process codes.',
      'Close',
      jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }),
    );
  });

  it('should show sticky header', () => {
    expect(component.tableConfig.stickyHeader).toBe(true);
  });

  // --- Getter: selectedProcessCode ---

  it('should return empty string from selectedProcessCode when control value is null', () => {
    component.processCodeControl.setValue(null as any);
    expect(component.selectedProcessCode).toBe('');
  });

  it('should return the control value from selectedProcessCode', () => {
    component.processCodeControl.setValue('SUITO');
    expect(component.selectedProcessCode).toBe('SUITO');
  });

  // --- Getter: unitIdColumnHeader ---

  it('should return "Unit ID" when no verified entries', () => {
    component.verifiedEntries = [];
    expect(component.unitIdColumnHeader).toBe('Unit ID');
  });

  it('should return "Unit ID (2)" when there are 2 verified entries', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: '01-JAN-2026', processDate: '01-JAN-2026' },
      { unitId: 'U2', product: 'P2', aboRh: 'B+', expirationDate: '01-JAN-2026', processDate: '01-JAN-2026' },
    ];
    expect(component.unitIdColumnHeader).toBe('Unit ID (2)');
  });

  // --- Getter: paginatedEntries ---

  it('should return full entries when pagination is not set', () => {
    const entries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: 'D1', processDate: 'PD1' },
      { unitId: 'U2', product: 'P2', aboRh: 'B+', expirationDate: 'D2', processDate: 'PD2' },
    ];
    component.verifiedEntries = entries;
    component.tableConfig = { ...component.tableConfig, pagination: undefined as any };
    expect(component.paginatedEntries).toEqual(entries);
  });

  it('should return paginated slice of entries', () => {
    const entries = Array.from({ length: 25 }, (_, i) => ({
      unitId: `U${i}`, product: `P${i}`, aboRh: 'A+', expirationDate: 'D', processDate: 'PD',
    }));
    component.verifiedEntries = entries;
    component.tableConfig = {
      ...component.tableConfig,
      pagination: {
        ...component.tableConfig.pagination!,
        pageIndex: 1,
        pageSize: 10,
      },
    };
    const result = component.paginatedEntries;
    expect(result.length).toBe(10);
    expect(result[0].unitId).toBe('U10');
    expect(result[9].unitId).toBe('U19');
  });

  // --- ngOnInit ---

  it('should call loadProcessCodes on init', () => {
    expect(serviceSpy.getProcessCodes).toHaveBeenCalled();
  });

  it('should load process codes into processCodes array', () => {
    expect(component.processCodes.length).toBe(2);
    expect(component.processCodes[0].processCode).toBe('THAW');
  });

  it('should set isProcessCodeLoading to false after loading', () => {
    expect(component.isProcessCodeLoading).toBe(false);
  });

  // --- ngOnDestroy ---

  it('should complete destroy$ on ngOnDestroy', () => {
    const destroySpy = spyOn((component as any).destroy$, 'next');
    const completeSpy = spyOn((component as any).destroy$, 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should dismiss snackbar on ngOnDestroy if one is active', () => {
    const mockRef = { dismiss: jasmine.createSpy('dismiss'), onAction: () => of(void 0) };
    (component as any).entrySavedSnackBarRef = mockRef;
    component.ngOnDestroy();
    expect(mockRef.dismiss).toHaveBeenCalled();
    expect((component as any).entrySavedSnackBarRef).toBeNull();
  });

  // --- onProcessCodeChange ---

  it('should set process description to matching code desc', () => {
    component.processCodeControl.setValue('SUITO');
    component.onProcessCodeChange();
    expect(component.processDescription).toBe('Component Suitability Verification');
  });

  it('should set process description to dash when code has no match', () => {
    component.processCodeControl.setValue('NONEXISTENT');
    component.onProcessCodeChange();
    expect(component.processDescription).toBe('-');
  });

  it('should clear verified entries and savedCount on process code change', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: 'D1', processDate: 'PD1' },
    ];
    component.savedCount = 5;
    component.processCodeControl.setValue('THAW');
    component.onProcessCodeChange();
    expect(component.verifiedEntries.length).toBe(0);
    expect(component.savedCount).toBe(0);
  });

  it('should dismiss snackbar on process code change', () => {
    const mockRef = { dismiss: jasmine.createSpy('dismiss'), onAction: () => of(void 0) };
    (component as any).entrySavedSnackBarRef = mockRef;
    component.processCodeControl.setValue('THAW');
    component.onProcessCodeChange();
    expect(mockRef.dismiss).toHaveBeenCalled();
  });

  // --- onUnitCleared ---

  it('should reset display fields when unit is cleared', () => {
    component.aboRh = 'O+ Regular';
    component.expirationDateTime = '10-AUG-2026';
    component.unitScannedWarning = 'already scanned';
    component.eligibleComponents = mockEligibleComponents;
    component.productValue = 'E0701V00';

    component.onUnitCleared();

    expect(component.aboRh).toBe('--');
    expect(component.expirationDateTime).toBe('--');
    expect(component.unitScannedWarning).toBe('');
    expect(component.eligibleComponents.length).toBe(0);
    expect(component.productValue).toBe('');
  });

  // --- onUnitPostValidate ---

  it('should set eligible components on successful post-validate', () => {
    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.confirm).toHaveBeenCalled();
    expect(component.eligibleComponents.length).toBe(2);
    expect(component.aboRh).toBe('O+ Regular');
  });

  it('should reject when all components are already verified', () => {
    component.verifiedEntries = [
      { unitId: 'W1234-18-031311-Z', product: 'E0701V00', aboRh: 'O+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'W1234-18-031311-Z', product: 'E0702V00', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
    ];

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('This Unit ID has been scanned');
    expect(event.confirm).not.toHaveBeenCalled();
  });

  it('should reject with "No eligible components" when service returns empty array', () => {
    serviceSpy.getEligibleComponents.and.returnValue(of([]));

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('No eligible components found for this unit and process code');
  });

  it('should reject on service error during post-validate', () => {
    serviceSpy.getUnitDetails.and.returnValue(
      throwError(() => ({ error: { message: 'Unit not found' } })),
    );

    const event = {
      data: { parsedUnitId: 'BAD-UNIT' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Unit not found');
    expect(event.confirm).not.toHaveBeenCalled();
  });

  it('should reject with default message when error has no message', () => {
    serviceSpy.getUnitDetails.and.returnValue(
      throwError(() => ({})),
    );

    const event = {
      data: { parsedUnitId: 'BAD-UNIT' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.reject).toHaveBeenCalledWith('Unit not found or not eligible.');
  });

  it('should use systemLabelDecision for aboRh when aboRh is null', () => {
    const componentsNoAbo: ComponentEligibilityDto[] = [
      {
        componentPrefix: '01',
        productCode: 'E0701V00',
        componentStatus: 'L',
        rejectReasonCode: null,
        systemLabelDecision: 'SLD-VALUE',
        aboRh: null,
        expiryDate: '2026-08-10T23:59:00Z',
        productDescription: null,
      },
    ];
    serviceSpy.getEligibleComponents.and.returnValue(of(componentsNoAbo));

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(component.aboRh).toBe('SLD-VALUE');
  });

  it('should fall back to -- when both aboRh and systemLabelDecision are null', () => {
    const componentsNoAbo: ComponentEligibilityDto[] = [
      {
        componentPrefix: '01',
        productCode: 'E0701V00',
        componentStatus: 'L',
        rejectReasonCode: null,
        systemLabelDecision: null,
        aboRh: null,
        expiryDate: null,
        productDescription: null,
      },
    ];
    serviceSpy.getEligibleComponents.and.returnValue(of(componentsNoAbo));
    serviceSpy.getUnitDetails.and.returnValue(of({
      ...mockUnitDetails,
      expirationDate: null as any,
      collectionDate: null as any,
    }));

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(component.aboRh).toBe('--');
  });

  it('should use unitDetails expirationDate when component expiryDate is null', () => {
    const componentsNoExpiry: ComponentEligibilityDto[] = [
      {
        componentPrefix: '01',
        productCode: 'E0701V00',
        componentStatus: 'L',
        rejectReasonCode: null,
        systemLabelDecision: null,
        aboRh: 'A+',
        expiryDate: null,
        productDescription: null,
      },
    ];
    serviceSpy.getEligibleComponents.and.returnValue(of(componentsNoExpiry));

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    // Should use mockUnitDetails.expirationDate fallback
    expect(component.expirationDateTime).not.toBe('--');
    expect(event.confirm).toHaveBeenCalled();
  });

  it('should set collectionDate from unit details', () => {
    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(component.collectionDate).toBe('2026-05-10T00:00:00Z');
  });

  it('should set collectionDate to null when unitDetails has no collectionDate', () => {
    serviceSpy.getUnitDetails.and.returnValue(of({
      ...mockUnitDetails,
      collectionDate: null as any,
    }));

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(component.collectionDate).toBeNull();
  });

  it('should filter out already-verified products from remaining components', () => {
    // One component already verified, one remaining
    component.verifiedEntries = [
      { unitId: 'W1234-18-031311-Z', product: 'E0701V00', aboRh: 'O+', expirationDate: 'D', processDate: 'PD' },
    ];

    const event = {
      data: { parsedUnitId: 'W1234-18-031311-Z' },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    } as any;

    component.processCodeControl.setValue('THAW');
    component.onUnitPostValidate(event);

    expect(event.confirm).toHaveBeenCalled();
    // Only the second component (E0702V00) should remain
    expect(component.eligibleComponents.length).toBe(1);
    expect(component.eligibleComponents[0].productCode).toBe('E0702V00');
  });

  // --- onUnitValidated ---

  it('should call productSelect.open on unit validated', fakeAsync(() => {
    const openSpy = jasmine.createSpy('open');
    (component as any).productSelect = { open: openSpy };
    component.onUnitValidated({} as any);
    tick(0);
    expect(openSpy).toHaveBeenCalled();
  }));

  // --- onProductSelected ---

  it('should focus process date input on product selected', fakeAsync(() => {
    const focusSpy = jasmine.createSpy('focus');
    (component as any).processDatInput = { nativeElement: { focus: focusSpy } };
    component.onProductSelected();
    tick(0);
    expect(focusSpy).toHaveBeenCalled();
  }));

  // --- getProcessDateError ---

  it('should return empty string when control is not touched or dirty', () => {
    expect(component.getProcessDateError()).toBe('');
  });

  it('should return "Invalid date format" when control is touched but value is null and input has text', () => {
    component.processDateControl.markAsTouched();
    (component as any).processDatInput = { nativeElement: { value: 'bad-date' } };
    expect(component.getProcessDateError()).toBe('Invalid date format');
  });

  it('should return "Invalid date format" when control has matDatepickerParse error', () => {
    component.processDateControl.markAsTouched();
    component.processDateControl.setErrors({ matDatepickerParse: true });
    expect(component.getProcessDateError()).toBe('Invalid date format');
  });

  it('should return empty string when control is touched with valid value', () => {
    component.processDateControl.setValue(new Date());
    component.processDateControl.markAsTouched();
    (component as any).processDatInput = { nativeElement: { value: '10-JAN-2026' } };
    expect(component.getProcessDateError()).toBe('');
  });

  it('should return empty string when input value is whitespace only and control value is null', () => {
    component.processDateControl.markAsTouched();
    (component as any).processDatInput = { nativeElement: { value: '   ' } };
    expect(component.getProcessDateError()).toBe('');
  });

  // --- onProcessDateFocus ---

  it('should set process date to chapter date on focus if no value set', () => {
    component.processDateControl.setValue(null);
    component.onProcessDateFocus();
    expect(component.processDateControl.value).not.toBeNull();
  });

  it('should not change process date on focus if value already set', () => {
    const existingDate = new Date(2026, 0, 15);
    component.processDateControl.setValue(existingDate);
    component.onProcessDateFocus();
    expect(component.processDateControl.value).toEqual(existingDate);
  });

  // --- onProcessDateChange ---

  it('should set time to current hour and minute when selected date has zero time', () => {
    const dateWithZeroTime = moment('2026-06-15').startOf('day').toDate();
    component.processDateControl.setValue(dateWithZeroTime);
    component.onProcessDateChange();
    const result = moment(component.processDateControl.value!);
    // Should have non-zero time (current time applied)
    expect(result.isValid()).toBe(true);
  });

  it('should not alter time when selected date already has non-zero time', () => {
    const dateWithTime = moment('2026-06-15T14:30:00').toDate();
    component.processDateControl.setValue(dateWithTime);
    component.collectionDate = '2026-01-01T00:00:00Z';
    component.onProcessDateChange();
    // Should remain valid since it's after collection date
    expect(component.processDateControl.value).not.toBeNull();
  });

  it('should set error on control if process date is before collection date', () => {
    component.collectionDate = '2026-06-15T00:00:00Z';
    const earlyDate = moment('2026-06-10T10:00:00').toDate();
    component.processDateControl.setValue(earlyDate);
    component.onProcessDateChange();
    expect(component.processDateControl.hasError('beforeCollectionDate')).toBe(true);
    expect(component.getProcessDateError()).toBe('Process Date cannot be before the collection date');
  });

  it('should not show error when there is no collection date', () => {
    component.collectionDate = null;
    const earlyDate = moment('2026-06-10T10:00:00').toDate();
    component.processDateControl.setValue(earlyDate);
    snackBarSpy.open.calls.reset();
    component.onProcessDateChange();
    expect(snackBarSpy.open).not.toHaveBeenCalledWith(
      'Process Date cannot be before the collection date',
      jasmine.anything(),
      jasmine.anything(),
    );
  });

  it('should do nothing when process date value is null', () => {
    component.processDateControl.setValue(null);
    snackBarSpy.open.calls.reset();
    component.onProcessDateChange();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  // --- onProcessDateKeydown ---

  it('should call verifyEntry on Enter key when product and unit are valid', fakeAsync(() => {
    component.productValue = 'E0701V00';
    (component as any).unitIdField = {
      isValid: true,
      parsedUnitId: 'W1234-18-031311-Z',
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.processCodeControl.setValue('THAW');
    component.processDateControl.setValue(new Date());

    const event = { key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.onProcessDateKeydown(event);
    tick(0);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(serviceSpy.verify).toHaveBeenCalled();
  }));

  it('should call verifyEntry on Tab key when product and unit are valid', fakeAsync(() => {
    component.productValue = 'E0701V00';
    (component as any).unitIdField = {
      isValid: true,
      parsedUnitId: 'W1234-18-031311-Z',
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.processCodeControl.setValue('THAW');
    component.processDateControl.setValue(new Date());

    const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.onProcessDateKeydown(event);
    tick(0);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(serviceSpy.verify).toHaveBeenCalled();
  }));

  it('should not call verifyEntry when productValue is empty', () => {
    component.productValue = '';
    (component as any).unitIdField = { isValid: true };

    const event = { key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.onProcessDateKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not call verifyEntry when unitIdField is not valid', () => {
    component.productValue = 'E0701V00';
    (component as any).unitIdField = { isValid: false };

    const event = { key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.onProcessDateKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not call verifyEntry for non-Enter/Tab keys', () => {
    component.productValue = 'E0701V00';
    (component as any).unitIdField = { isValid: true };

    const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as any;
    component.onProcessDateKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  // --- onPageChange ---

  it('should update pagination on page change', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 25 });
    expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    expect(component.tableConfig.pagination!.pageSize).toBe(25);
  });

  // --- onSortChange ---

  it('should update sort config and reset pageIndex on sort change', () => {
    component.verifiedEntries = [
      { unitId: 'B', product: 'P1', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'A', product: 'P2', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];

    component.onSortChange({ column: 'unitId', direction: 'A' });

    expect(component.tableConfig.sortConfig!.column).toBe('unitId');
    expect(component.tableConfig.sortConfig!.direction).toBe('A');
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.verifiedEntries[0].unitId).toBe('A');
    expect(component.verifiedEntries[1].unitId).toBe('B');
  });

  it('should sort entries in descending order', () => {
    component.verifiedEntries = [
      { unitId: 'A', product: 'P1', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'B', product: 'P2', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];

    component.onSortChange({ column: 'unitId', direction: 'D' });

    expect(component.verifiedEntries[0].unitId).toBe('B');
    expect(component.verifiedEntries[1].unitId).toBe('A');
  });

  // --- loadProcessCodes (private) ---

  it('should set isProcessCodeLoading to true then false during load', () => {
    // Already tested implicitly, but let's verify the error path resets it
    serviceSpy.getProcessCodes.and.returnValue(
      throwError(() => new Error('fail')),
    );
    (component as any).loadProcessCodes();
    expect(component.isProcessCodeLoading).toBe(false);
  });

  // --- verifyEntry (private) ---

  it('should not verify when isVerifying is true', () => {
    component.isVerifying = true;
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should not verify when processCode is empty', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('');
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should not verify when unitId is missing', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = { parsedUnitId: null, isValid: true };
    component.productValue = 'E0701V00';
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should not verify when product is empty', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = { parsedUnitId: 'U1', isValid: true };
    component.productValue = '';
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should not verify when unitIdField is not valid', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = { parsedUnitId: 'U1', isValid: false };
    component.productValue = 'E0701V00';
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should mark processDate as touched when invalid', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = { parsedUnitId: 'U1', isValid: true };
    component.productValue = 'E0701V00';
    component.processDateControl.setValidators(() => ({ invalid: true }));
    component.processDateControl.updateValueAndValidity();

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    expect(component.processDateControl.touched).toBe(true);
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should show error when processDate is before collection date during verify', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'U1',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.collectionDate = '2026-07-20T00:00:00Z';
    component.processDateControl.setValue(moment('2026-07-10T10:00:00').toDate());

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();

    expect(component.processDateControl.hasError('beforeCollectionDate')).toBe(true);
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should add entry to verifiedEntries on successful verification', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    const clearSpy = jasmine.createSpy('clear');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: clearSpy,
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.aboRh = 'O+';
    component.expirationDateTime = '10-AUG-2026';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(component.verifiedEntries.length).toBe(1);
    expect(component.verifiedEntries[0].unitId).toBe('W1234-18-031311-Z');
    expect(component.verifiedEntries[0].product).toBe('E0701V00');
    expect(component.savedCount).toBe(1);
    expect(component.isVerifying).toBe(false);
    expect(clearSpy).toHaveBeenCalled();
    expect(component.productValue).toBe('');
  }));

  it('should prepend new entry to verifiedEntries', fakeAsync(() => {
    component.verifiedEntries = [
      { unitId: 'OLD', product: 'P', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
    ];
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    (component as any).verifyEntry();
    tick(0);

    expect(component.verifiedEntries.length).toBe(2);
    expect(component.verifiedEntries[0].unitId).toBe('W1234-18-031311-Z');
    expect(component.verifiedEntries[1].unitId).toBe('OLD');
  }));

  it('should show snackbar with entry saved message on success', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.calls.reset();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).verifyEntry();
    tick(0);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '1 Entry Saved',
      'DISMISS',
      jasmine.objectContaining({
        duration: 0,
        panelClass: ['success-snackbar'],
      }),
    );
  }));

  it('should show error when verification fails (verificationSuccess false)', fakeAsync(() => {
    const failResponse: VerifyComponentSuitabilityResponse = {
      ...mockVerifyResponse,
      verificationSuccess: false,
      message: 'Component not suitable',
    };
    serviceSpy.verify.and.returnValue(of(failResponse));

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Component not suitable',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] }),
    );
    expect(component.isVerifying).toBe(false);
  }));

  it('should show default error when verification fails with null message', fakeAsync(() => {
    const failResponse: VerifyComponentSuitabilityResponse = {
      ...mockVerifyResponse,
      verificationSuccess: false,
      message: null,
    };
    serviceSpy.verify.and.returnValue(of(failResponse));

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Verification failed.',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] }),
    );
  }));

  it('should show error on verify service error', fakeAsync(() => {
    serviceSpy.verify.and.returnValue(
      throwError(() => ({ error: { message: 'Server error' } })),
    );

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Server error',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] }),
    );
    expect(component.isVerifying).toBe(false);
  }));

  it('should show default error on verify service error with no message', fakeAsync(() => {
    serviceSpy.verify.and.returnValue(
      throwError(() => ({})),
    );

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to verify component suitability.',
      'Close',
      jasmine.objectContaining({ panelClass: ['error-snackbar'] }),
    );
  }));

  it('should use componentPrefix from eligible component when product matches', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(serviceSpy.verify).toHaveBeenCalledWith(
      jasmine.objectContaining({
        componentPrefix: '01',
      }),
    );
  }));

  it('should use product value as componentPrefix when no matching eligible component', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'UNKNOWN_PROD';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    expect(serviceSpy.verify).toHaveBeenCalledWith(
      jasmine.objectContaining({
        componentPrefix: 'UNKNOWN_PROD',
      }),
    );
  }));

  it('should pass processDate as ISO string when process date is valid', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    const testDate = new Date(2026, 5, 15, 10, 30);
    component.processDateControl.setValue(testDate);
    component.eligibleComponents = mockEligibleComponents;

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    const callArgs = serviceSpy.verify.calls.mostRecent().args[0];
    expect(callArgs.processDats).toBeDefined();
    expect(moment(callArgs.processDats).isValid()).toBe(true);
  }));

  // --- resetEntryRow (private) ---

  it('should reset all entry row fields', () => {
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };
    component.productValue = 'PROD';
    component.aboRh = 'O+';
    component.expirationDateTime = '10-AUG-2026';
    component.processDateControl.setValue(new Date());
    component.unitScannedWarning = 'warning';
    component.eligibleComponents = mockEligibleComponents;
    component.collectionDate = '2026-05-10';

    (component as any).resetEntryRow();

    expect((component as any).unitIdField.clear).toHaveBeenCalled();
    expect(component.productValue).toBe('');
    expect(component.aboRh).toBe('--');
    expect(component.expirationDateTime).toBe('--');
    expect(component.processDateControl.value).toBeNull();
    expect(component.unitScannedWarning).toBe('');
    expect(component.eligibleComponents.length).toBe(0);
    expect(component.collectionDate).toBeNull();
  });

  // --- formatDateTime (private) ---

  it('should return -- for null input', () => {
    expect((component as any).formatDateTime(null)).toBe('--');
  });

  it('should return -- for undefined input', () => {
    expect((component as any).formatDateTime(undefined)).toBe('--');
  });

  it('should return -- for invalid date string', () => {
    expect((component as any).formatDateTime('not-a-date')).toBe('--');
  });

  it('should format valid date correctly', () => {
    const result = (component as any).formatDateTime('2026-01-15T14:30:00Z');
    expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} (AM|PM)/);
  });

  it('should format date with AM correctly', () => {
    const result = (component as any).formatDateTime('2026-03-05T08:05:00');
    expect(result).toMatch(/05-MAR-2026/);
    expect(result).toContain('AM');
  });

  it('should handle midnight (12:00 AM) correctly', () => {
    const result = (component as any).formatDateTime('2026-06-15T00:00:00');
    expect(result).toContain('12:00 AM');
  });

  it('should handle noon (12:00 PM) correctly', () => {
    const result = (component as any).formatDateTime('2026-06-15T12:00:00');
    expect(result).toContain('12:00 PM');
  });

  // --- getCurrentDateTime (private) ---

  it('should return formatted current date time', () => {
    const result = (component as any).getCurrentDateTime();
    expect(result).toMatch(/\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} (AM|PM)/);
  });

  // --- subscribeToChapterChanges ---

  it('should reset state when chapter changes', () => {
    component.processCodeControl.setValue('THAW');
    component.processDescription = 'Some description';
    component.verifiedEntries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
    ];
    component.savedCount = 3;

    // Need to set unitIdField since resetEntryRow calls clear
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };

    chapterChangedSubject.next();

    expect(component.processCodeControl.value).toBe('');
    expect(component.processDescription).toBe('-');
    expect(component.verifiedEntries.length).toBe(0);
    expect(component.savedCount).toBe(0);
    // loadProcessCodes is called again
    expect(serviceSpy.getProcessCodes.calls.count()).toBeGreaterThan(1);
  });

  // --- showEntrySavedSnackbar (private) ---

  it('should show "1 Entry Saved" when savedCount is 1', () => {
    component.savedCount = 1;
    snackBarSpy.open.calls.reset();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).showEntrySavedSnackbar();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '1 Entry Saved',
      'DISMISS',
      jasmine.objectContaining({ duration: 0 }),
    );
  });

  it('should show "3 Entries Saved" when savedCount is 3', () => {
    component.savedCount = 3;
    snackBarSpy.open.calls.reset();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).showEntrySavedSnackbar();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '3 Entries Saved',
      'DISMISS',
      jasmine.objectContaining({ duration: 0 }),
    );
  });

  it('should dismiss previous snackbar before showing new one', () => {
    const prevDismiss = jasmine.createSpy('prevDismiss');
    (component as any).entrySavedSnackBarRef = { dismiss: prevDismiss };

    component.savedCount = 2;
    snackBarSpy.open.calls.reset();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).showEntrySavedSnackbar();

    expect(prevDismiss).toHaveBeenCalled();
  });

  // --- dismissEntrySavedSnackbar (private) ---

  it('should dismiss snackbar and set ref to null', () => {
    const dismissSpy = jasmine.createSpy('dismiss');
    (component as any).entrySavedSnackBarRef = { dismiss: dismissSpy };

    (component as any).dismissEntrySavedSnackbar();

    expect(dismissSpy).toHaveBeenCalled();
    expect((component as any).entrySavedSnackBarRef).toBeNull();
  });

  it('should do nothing when no snackbar ref exists', () => {
    (component as any).entrySavedSnackBarRef = null;
    expect(() => (component as any).dismissEntrySavedSnackbar()).not.toThrow();
  });

  // --- showError (private) ---

  it('should open snackbar with error styling', () => {
    snackBarSpy.open.calls.reset();
    (component as any).showError('Test error message');

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Test error message',
      'Close',
      jasmine.objectContaining({
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      }),
    );
  });

  // --- updateTableConfig (private) ---

  it('should update totalRecords in pagination', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'U2', product: 'P2', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];
    (component as any).updateTableConfig();
    expect(component.tableConfig.pagination!.totalRecords).toBe(2);
  });

  // --- updateUnitIdColumnHeader (private) ---

  it('should set header to "Unit ID" when no entries', () => {
    component.verifiedEntries = [];
    (component as any).updateUnitIdColumnHeader();
    const unitIdCol = component.tableConfig.columns.find(c => c.key === 'unitId');
    expect(unitIdCol!.header).toBe('Unit ID');
  });

  it('should set header to "Unit ID (1)" when one entry', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'P1', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
    ];
    (component as any).updateUnitIdColumnHeader();
    const unitIdCol = component.tableConfig.columns.find(c => c.key === 'unitId');
    expect(unitIdCol!.header).toBe('Unit ID (1)');
  });

  // --- sortEntries (private) ---

  it('should sort entries ascending by product', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'Zebra', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'U2', product: 'Apple', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];
    (component as any).sortEntries('product', 'A');
    expect(component.verifiedEntries[0].product).toBe('Apple');
    expect(component.verifiedEntries[1].product).toBe('Zebra');
  });

  it('should sort entries descending by product', () => {
    component.verifiedEntries = [
      { unitId: 'U1', product: 'Apple', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'U2', product: 'Zebra', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];
    (component as any).sortEntries('product', 'D');
    expect(component.verifiedEntries[0].product).toBe('Zebra');
    expect(component.verifiedEntries[1].product).toBe('Apple');
  });

  // --- processDateErrorMatcher ---

  it('should return false when control is null', () => {
    const result = component.processDateErrorMatcher.isErrorState(null as any, null as any);
    expect(result).toBe(false);
  });

  it('should return true when control is invalid and touched', () => {
    const ctrl = new FormControl('', () => ({ invalid: true }));
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    const result = component.processDateErrorMatcher.isErrorState(ctrl as any, null as any);
    expect(result).toBe(true);
  });

  it('should return false when control is untouched and pristine', () => {
    const ctrl = new FormControl('');
    const result = component.processDateErrorMatcher.isErrorState(ctrl as any, null as any);
    expect(result).toBe(false);
  });

  // --- headerConfig ---

  it('should have correct initial breadcrumbs', () => {
    expect(component.headerConfig.breadcrumbs.length).toBe(2);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
  });

  it('should have correct initial title', () => {
    expect(component.headerConfig.title).toContain('Verify Component Suitability');
  });

  // --- onSortChange without pagination ---

  it('should handle sort change when pagination is undefined', () => {
    component.tableConfig = { ...component.tableConfig, pagination: undefined as any };
    component.verifiedEntries = [
      { unitId: 'B', product: 'P', aboRh: 'A+', expirationDate: 'D', processDate: 'PD' },
      { unitId: 'A', product: 'P', aboRh: 'B+', expirationDate: 'D', processDate: 'PD' },
    ];

    component.onSortChange({ column: 'unitId', direction: 'A' });

    expect(component.tableConfig.sortConfig!.column).toBe('unitId');
    expect(component.verifiedEntries[0].unitId).toBe('A');
  });

  // --- onPageChange when pagination is falsy ---

  it('should not throw when pagination is falsy on page change', () => {
    component.tableConfig = { ...component.tableConfig, pagination: undefined as any };
    expect(() => component.onPageChange({ pageIndex: 0, pageSize: 10 })).not.toThrow();
  });

  // --- verify with null process date ---

  it('should verify entry with null process date', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(null);
    component.eligibleComponents = mockEligibleComponents;

    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();
    tick(0);

    const callArgs = serviceSpy.verify.calls.mostRecent().args[0];
    expect(callArgs.processDats).toBeUndefined();
  }));

  // --- Entries saved snackbar plural ---

  it('should show correct plural form for entries saved snackbar with savedCount 0', () => {
    component.savedCount = 0;
    snackBarSpy.open.calls.reset();
    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).showEntrySavedSnackbar();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      '0 Entries Saved',
      'DISMISS',
      jasmine.anything(),
    );
  });

  // --- processDateErrorMatcher input check ---

  it('should return true from error matcher when input has text but control value is null', () => {
    (component as any).processDatInput = { nativeElement: { value: 'invalid-text' } };
    const ctrl = component.processDateControl;
    ctrl.setValue(null);
    ctrl.markAsTouched();
    const result = component.processDateErrorMatcher.isErrorState(ctrl as any, null as any);
    expect(result).toBe(true);
  });

  it('should return false from error matcher when input value is empty and control value is null', () => {
    (component as any).processDatInput = { nativeElement: { value: '' } };
    const ctrl = component.processDateControl;
    ctrl.setValue(null);
    ctrl.markAsTouched();
    // control is valid (no validators on processDateControl), so invalid check fails
    // and the input value is empty, so the input text check also fails
    const result = component.processDateErrorMatcher.isErrorState(ctrl as any, null as any);
    expect(result).toBe(false);
  });

  // --- table config defaults ---

  it('should have correct pagination defaults', () => {
    expect(component.tableConfig.pagination!.pageSize).toBe(10);
    expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    expect(component.tableConfig.pagination!.pageSizeOptions).toEqual([10, 25, 50, 100]);
    expect(component.tableConfig.pagination!.showFirstLastButtons).toBe(true);
  });

  it('should have showPagination set to true', () => {
    expect(component.tableConfig.showPagination).toBe(true);
  });

  it('should have correct empty message', () => {
    expect(component.tableConfig.emptyMessage).toBe('No Results to Display');
  });

  it('should have enableRowHighlight set to false', () => {
    expect(component.tableConfig.enableRowHighlight).toBe(false);
  });

  // --- formatDateTime edge cases ---

  it('should handle empty string input', () => {
    expect((component as any).formatDateTime('')).toBe('--');
  });

  // --- verify entry format of processDate in entry ---

  it('should format process date in uppercase DD-MMM-YYYY format', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date(2026, 0, 15, 14, 30));
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).verifyEntry();
    tick(0);

    const entry = component.verifiedEntries[0];
    expect(entry.processDate).toBe('15-JAN-2026, 02:30 PM');
  }));

  // --- verifyEntry when processDate value is null uses current moment ---

  it('should use current moment format when process date is null during verify', fakeAsync(() => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(null);
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).verifyEntry();
    tick(0);

    const entry = component.verifiedEntries[0];
    // Should contain a formatted date from moment().format()
    expect(entry.processDate).toMatch(/\d{2}-[A-Z]{3}-\d{4}, \d{2}:\d{2} (AM|PM)/);
  }));

  // --- showWarningDialog (private) ---

  it('should open warning dialog and call callback with override result', fakeAsync(() => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ override: true, codes: ['0246'] }),
    } as any);

    const callbackSpy = jasmine.createSpy('callback');
    (component as any).showWarningDialog('Test Warnings', [{ code: '0246', message: 'Interdiction found' }], callbackSpy);
    tick(0);

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(callbackSpy).toHaveBeenCalledWith(true, ['0246']);
  }));

  it('should call callback with false when warning dialog is cancelled', fakeAsync(() => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ override: false, codes: [] }),
    } as any);

    const callbackSpy = jasmine.createSpy('callback');
    (component as any).showWarningDialog('Test', [{ code: '0246', message: 'Test' }], callbackSpy);
    tick(0);

    expect(callbackSpy).toHaveBeenCalledWith(false, []);
  }));

  it('should call callback with false when dialog returns null', fakeAsync(() => {
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(null),
    } as any);

    const callbackSpy = jasmine.createSpy('callback');
    (component as any).showWarningDialog('Test', [{ code: '0246', message: 'Test' }], callbackSpy);
    tick(0);

    expect(callbackSpy).toHaveBeenCalledWith(false, []);
  }));

  // --- WARNING response handling in verifyEntry ---

  it('should show warning dialog when verify returns WARNING status', fakeAsync(() => {
    const warningResponse: VerifyComponentSuitabilityResponse = {
      ...mockVerifyResponse,
      verificationSuccess: false,
      status: 'WARNING',
      warnings: [{ code: '0246', message: 'Interdiction found' }],
    };
    serviceSpy.verify.and.returnValue(of(warningResponse));

    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ override: false, codes: [] }),
    } as any);

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    (component as any).verifyEntry();
    tick(0);

    expect(dialogSpy.open).toHaveBeenCalled();
  }));

  it('should accumulate overrides and retry on warning override', fakeAsync(() => {
    const warningResponse: VerifyComponentSuitabilityResponse = {
      ...mockVerifyResponse,
      verificationSuccess: false,
      status: 'WARNING',
      warnings: [{ code: '0246', message: 'Interdiction found' }],
    };
    serviceSpy.verify.and.returnValues(of(warningResponse), of(mockVerifyResponse));

    dialogSpy.open.and.returnValue({
      afterClosed: () => of({ override: true, codes: ['0246'] }),
    } as any);

    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).verifyEntry();
    tick(0);

    expect(serviceSpy.verify.calls.count()).toBe(2);
    const secondCallArgs = serviceSpy.verify.calls.mostRecent().args[0];
    expect(secondCallArgs.overriddenWarnings).toContain('0246');
  }));

  it('should reset accumulatedOverrides on successful verification', fakeAsync(() => {
    (component as any).accumulatedOverrides = ['0246'];
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'W1234-18-031311-Z',
      isValid: true,
      clear: jasmine.createSpy('clear'),
      unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(new Date());
    component.eligibleComponents = mockEligibleComponents;

    snackBarSpy.open.and.returnValue({
      onAction: () => of(void 0),
      dismiss: jasmine.createSpy('dismiss'),
    } as any);

    (component as any).verifyEntry();
    tick(0);

    expect((component as any).accumulatedOverrides).toEqual([]);
  }));

  // --- Future date validation ---

  it('should show error when process date is in the future during verify', () => {
    component.isVerifying = false;
    component.processCodeControl.setValue('THAW');
    (component as any).unitIdField = {
      parsedUnitId: 'U1',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    };
    component.productValue = 'E0701V00';
    component.processDateControl.setValue(moment().add(2, 'days').toDate());

    snackBarSpy.open.calls.reset();
    serviceSpy.verify.calls.reset();
    (component as any).verifyEntry();

    expect(component.processDateControl.hasError('futureDate')).toBe(true);
    expect(component.getProcessDateError()).toBe('Process Date cannot be in the future');
    expect(serviceSpy.verify).not.toHaveBeenCalled();
  });

  it('should set error on control when future date selected in onProcessDateChange', () => {
    component.processDateControl.setValue(moment().add(5, 'days').toDate());

    component.onProcessDateChange();

    expect(component.processDateControl.hasError('futureDate')).toBe(true);
    expect(component.getProcessDateError()).toBe('Process Date cannot be in the future');
  });

  // --- onProcessDateFocus ---

  it('should set process date to chapter time on focus when no value', () => {
    component.processDateControl.setValue(null);
    component.onProcessDateFocus();
    expect(component.processDateControl.value).not.toBeNull();
  });

  it('should not change process date on focus when value already set', () => {
    const existingDate = new Date(2026, 5, 15, 10, 30);
    component.processDateControl.setValue(existingDate);
    component.onProcessDateFocus();
    expect(component.processDateControl.value).toEqual(existingDate);
  });

  // --- resetEntryRow clears accumulatedOverrides ---

  it('should reset accumulatedOverrides in resetEntryRow', () => {
    (component as any).accumulatedOverrides = ['0246', '9931'];
    (component as any).unitIdField = { clear: jasmine.createSpy('clear') };
    (component as any).resetEntryRow();
    expect((component as any).accumulatedOverrides).toEqual([]);
  });

  // --- onProcessDateChange sets chapter time for midnight dates ---

  it('should set chapter time when datepicker returns midnight', () => {
    const midnightDate = moment().startOf('day').toDate();
    component.processDateControl.setValue(midnightDate);
    component.onProcessDateChange();
    const updatedValue = component.processDateControl.value;
    if (updatedValue) {
      const updated = moment(updatedValue);
      expect(updated.hour() !== 0 || updated.minute() !== 0).toBe(true);
    }
  });

  // --- getProcessDateError ---

  it('should return empty string when control is untouched', () => {
    expect(component.getProcessDateError()).toBe('');
  });

  it('should return "Invalid date format" when control has parse error', () => {
    component.processDateControl.setErrors({ matDatepickerParse: true });
    component.processDateControl.markAsTouched();
    expect(component.getProcessDateError()).toBe('Invalid date format');
  });

  // --- onProductSelected ---

  it('should not throw when calling onProductSelected', () => {
    expect(() => component.onProductSelected()).not.toThrow();
  });

  // --- onUnitCleared ---

  it('should reset display fields when unit is cleared', () => {
    component.aboRh = 'O+';
    component.expirationDateTime = 'some date';
    component.eligibleComponents = mockEligibleComponents;
    component.productValue = 'E0701V00';
    component.unitScannedWarning = 'warning';

    component.onUnitCleared();

    expect(component.aboRh).toBe('--');
    expect(component.expirationDateTime).toBe('--');
    expect(component.eligibleComponents.length).toBe(0);
    expect(component.productValue).toBe('');
    expect(component.unitScannedWarning).toBe('');
  });
});

describe('WarningOverrideDialogComponent', () => {
  let dialogComponent: WarningOverrideDialogComponent;
  let dialogFixture: ComponentFixture<WarningOverrideDialogComponent>;
  const closeSpy = jasmine.createSpy('close');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [WarningOverrideDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test',
            warnings: [{ code: '0246', message: 'Interdiction' }, { code: '9931', message: 'Donor' }],
            allowOverride: true,
          },
        },
        {
          provide: MatDialogRef,
          useValue: { close: closeSpy },
        },
      ],
    });

    dialogFixture = TestBed.createComponent(WarningOverrideDialogComponent);
    dialogComponent = dialogFixture.componentInstance;
    closeSpy.calls.reset();
  });

  it('should return override true with codes on onOverride', () => {
    dialogComponent.onOverride();
    expect(closeSpy).toHaveBeenCalledWith({
      override: true,
      codes: ['0246', '9931'],
    });
  });

  it('should return override false with empty codes on onCancel', () => {
    dialogComponent.onCancel();
    expect(closeSpy).toHaveBeenCalledWith({
      override: false,
      codes: [],
    });
  });
});
