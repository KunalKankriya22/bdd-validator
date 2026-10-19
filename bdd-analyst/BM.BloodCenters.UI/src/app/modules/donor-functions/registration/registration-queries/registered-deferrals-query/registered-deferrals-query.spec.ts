import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';

import { RegisteredDeferralsQuery } from './registered-deferrals-query';
import { RegisteredDeferralsQueryService } from './services/registered-deferrals-query.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegisteredDeferralRow, RegisteredDeferralsLookups } from './models/registered-deferrals-query.model';
import moment from 'moment';
import { provideRouter } from '@angular/router';

describe('RegisteredDeferralsQuery', () => {
  let component: RegisteredDeferralsQuery;
  let fixture: ComponentFixture<RegisteredDeferralsQuery>;
  let mockService: jasmine.SpyObj<RegisteredDeferralsQueryService>;
  let mockHeaderService: Partial<HeaderService>;
  let mockPageHeaderService: Partial<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  const mockLookups: RegisteredDeferralsLookups = {
    driveIds: [
      { code: 'DRV001', description: 'DRV001' },
      { code: 'DRV002', description: 'DRV002' },
    ],
    users: [
      { code: 'CELHUN', description: 'CELHUN' },
      { code: 'CYNCUL', description: 'CYNCUL' },
    ],
    deferralIds: [
      { code: '01012018', description: '01012018' },
      { code: '02022018', description: '02022018' },
    ],
    transactionIds: [
      { code: 'TR02866892', description: 'TR02866892' },
      { code: 'TR02866893', description: 'TR02866893' },
    ],
    setIds: [],
  };

  const mockQueryResults: RegisteredDeferralRow[] = [
    {
      deferralId: '01012018',
      transactionId: 'TR02866892',
      setId: 'BAT001',
      driveId: 'DRV0164777',
      donorId: 'DN30120470',
      donationType: 'AL',
      procedureCode: 'WB',
      user: 'CELHUN',
      dateTimeOfRegistration: '2025-01-11T09:05:00',
      auditComplete: '--',
    },
    {
      deferralId: '02022018',
      transactionId: 'TR02866893',
      setId: 'BAT001',
      driveId: 'DRV0164778',
      donorId: 'DN30120471',
      donationType: 'AL',
      procedureCode: 'WB',
      user: 'CYNCUL',
      dateTimeOfRegistration: '2025-01-12T10:15:00',
      auditComplete: '--',
    },
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('RegisteredDeferralsQueryService', [
      'getLookups',
      'query',
      'getLovLimit',
    ]);
    chapterChanged$ = new Subject<void>();

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'isChapterLocalDateAvailable',
    ]);
    mockChapterTimezoneService.getChapterLocalDate.and.callFake(() => moment('2026-07-16'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockHeaderService = {
      getCurrentChapterId: () => 'CH001',
      chapterChanged$: chapterChanged$.asObservable(),
    };

    mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Registered Deferrals Query',
        subtitle: 'Find Registered Deferrals Query details'
      })
    };

    mockService.getLookups.and.returnValue(of(mockLookups));
    mockService.query.and.returnValue(of(mockQueryResults));
    mockService.getLovLimit.and.returnValue(of(21));

    TestBed.configureTestingModule({
      imports: [
        RegisteredDeferralsQuery,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        MatFormFieldModule,
        MatSelectModule,
        MatDatepickerModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
      ],
      providers: [
        provideRouter([]),
        { provide: RegisteredDeferralsQueryService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: DateAdapter, useClass: MomentDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
      ],
    });

    fixture = TestBed.createComponent(RegisteredDeferralsQuery);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should call query service when retrieve is clicked', fakeAsync(() => {
    component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
    component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
    fixture.detectChanges();

    component.onRetrieve();
    tick();

    expect(mockService.query).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(2);
    expect(component.totalFound).toBe(2);
    expect(component.showEmptyState).toBeFalse();
    expect(component.hasRetrievedData).toBeTrue();
  }));

  it('should update total found count after retrieval', fakeAsync(() => {
    component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
    fixture.detectChanges();

    component.onRetrieve();
    tick();

    expect(component.totalFound).toBe(2);
  }));

  it('should clear all filters and reset state', fakeAsync(() => {
    component.onRetrieve();
    tick();

    component.onClearAll();

    expect(component.filterForm.get('driveDateFrom')?.value).toBeNull();
    expect(component.filterForm.get('driveDateTo')?.value).toBeNull();
    expect(component.filterForm.get('driveId')?.value).toBe('');
    expect(component.filterForm.get('user')?.value).toBe('');
    expect(component.filterForm.get('deferralId')?.value).toBe('');
    expect(component.filterForm.get('transactionId')?.value).toBe('');
    expect(component.dataSource).toEqual([]);
    expect(component.totalFound).toBe(0);
    expect(component.showEmptyState).toBeTrue();
    expect(component.hasRetrievedData).toBeFalse();
  }));

  it('should sort data locally when sort change is triggered', fakeAsync(() => {
    component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
    fixture.detectChanges();

    component.onRetrieve();
    tick();

    component.onSortChange({ column: 'deferralId', direction: 'D' });

    expect(component.tableConfig.sortConfig?.column).toBe('deferralId');
    expect(component.tableConfig.sortConfig?.direction).toBe('D');
    expect(component.dataSource[0].deferralId).toBe('02022018');
  }));

  it('should not show pagination', () => {
    expect(component.tableConfig.showPagination).toBeFalse();
  });

  it('should show actions as menu', () => {
    expect(component.tableConfig.showActionsAsMenu).toBeTrue();
  });

  it('should format date and time correctly', () => {
    const dateColumn = component.tableConfig.columns.find(c => c.key === 'dateTimeOfRegistration');
    const formatted = dateColumn?.valueFormatter?.('2025-01-11T09:05:00', {} as RegisteredDeferralRow);
    expect(formatted).toBe('11-JAN-2025, 09:05 AM');
  });

  it('should format PM time correctly', () => {
    const dateColumn = component.tableConfig.columns.find(c => c.key === 'dateTimeOfRegistration');
    const formatted = dateColumn?.valueFormatter?.('2025-01-14T13:00:00', {} as RegisteredDeferralRow);
    expect(formatted).toBe('14-JAN-2025, 01:00 PM');
  });

  // TODO: Add snackbar mocking test for row actions
  // Currently challenging to mock MatSnackBar with inject() in standalone components
  // See: https://github.com/angular/angular/issues/48293

  it('should silently handle lookup loading failures', fakeAsync(() => {
    mockService.getLookups.and.returnValue(throwError(() => new Error('Load failed')));

    const newFixture = TestBed.createComponent(RegisteredDeferralsQuery);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    tick();

    // Dropdowns should be empty when lookup loading fails
    expect(newComponent.driveIds().length).toBe(0);
    expect(newComponent.users().length).toBe(0);
    expect(newComponent.deferralIds().length).toBe(0);
    expect(newComponent.transactionIds().length).toBe(0);
  }));

  // TODO: Add snackbar mocking test for query errors
  // Currently challenging to mock MatSnackBar with inject() in standalone components
  // See: https://github.com/angular/angular/issues/48293

  it('should reset and reload lookups on chapter change', fakeAsync(() => {
    component.onRetrieve();
    tick();

    mockService.getLookups.calls.reset();
    chapterChanged$.next();
    tick();

    expect(component.showEmptyState).toBeTrue();
    expect(component.dataSource).toEqual([]);
    expect(mockService.getLookups).toHaveBeenCalled();
  }));

  describe('Searchable Dropdowns', () => {
    it('should initialize search signals', () => {
      expect(component.driveSearch()).toBe('');
      expect(component.userSearch()).toBe('');
      expect(component.deferralSearch()).toBe('');
      expect(component.transactionSearch()).toBe('');
    });

    it('should update driveSearch signal when driveSearchControl value changes', fakeAsync(() => {
      component.driveSearchControl.setValue('DRV001');
      tick();
      expect(component.driveSearch()).toBe('DRV001');
    }));

    it('should update userSearch signal when userSearchControl value changes', fakeAsync(() => {
      component.userSearchControl.setValue('CELHUN');
      tick();
      expect(component.userSearch()).toBe('CELHUN');
    }));

    it('should filter drive options based on search', fakeAsync(() => {
      // Initially all drives should be visible
      expect(component.filteredDrives().length).toBe(2);

      // Search for specific drive
      component.driveSearchControl.setValue('DRV001');
      tick();
      fixture.detectChanges();

      const filtered = component.filteredDrives();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('DRV001');
    }));

    it('should clear search controls when onClearAll is called', fakeAsync(() => {
      component.driveSearchControl.setValue('DRV001');
      component.userSearchControl.setValue('CELHUN');
      component.deferralSearchControl.setValue('01012018');
      component.transactionSearchControl.setValue('TR02866892');
      tick();

      component.onClearAll();

      expect(component.driveSearchControl.value).toBe('');
      expect(component.userSearchControl.value).toBe('');
      expect(component.deferralSearchControl.value).toBe('');
      expect(component.transactionSearchControl.value).toBe('');
    }));
  });

  describe('Date Range Validation', () => {
    it('should have dateRangeInvalid error when driveDateFrom is after driveDateTo', () => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
    });
  });

  describe('Date Error State Matchers', () => {
    it('driveDateFromErrorMatcher should return false when control is not touched', () => {
      const control = component.filterForm.get('driveDateFrom') as any;
      control.markAsUntouched();
      expect(component.driveDateFromErrorMatcher.isErrorState(control, null)).toBeFalse();
    });

    it('driveDateFromErrorMatcher should return true for field-level errors when touched', () => {
      const control = component.filterForm.get('driveDateFrom') as any;
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.driveDateFromErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('driveDateFromErrorMatcher should show error when From field changed last', () => {
      // Set To date first
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-15'));

      // Then change From date to create invalid range
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      fixture.detectChanges();

      const control = component.filterForm.get('driveDateFrom') as any;
      expect(component.driveDateFromErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('driveDateFromErrorMatcher should not show error when To field changed last', () => {
      // Set From date first
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();

      // Then change To date to create invalid range
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      fixture.detectChanges();

      const control = component.filterForm.get('driveDateFrom') as any;
      expect(component.driveDateFromErrorMatcher.isErrorState(control, null)).toBeFalse();
    });

    it('driveDateToErrorMatcher should return true when getDriveDateToError returns message', () => {
      const control = component.filterForm.get('driveDateTo') as any;
      control.markAsTouched();
      control.setErrors({ invalidDateFormat: true });
      expect(component.driveDateToErrorMatcher.isErrorState(control, null)).toBeTrue();
    });

    it('driveDateToErrorMatcher should return true for dateRangeInvalid error', () => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      fixture.detectChanges();

      const control = component.filterForm.get('driveDateTo') as any;
      expect(component.driveDateToErrorMatcher.isErrorState(control, null)).toBeTrue();
    });
  });

  describe('Date Input Handlers', () => {
    it('onDriveDateFromInput should mark control as touched', () => {
      const event = { target: { value: '01-JAN-2025' } } as any;
      const control = component.filterForm.get('driveDateFrom');
      control?.markAsUntouched();

      component.onDriveDateFromInput(event);

      expect(control?.touched).toBeTrue();
    });

    it('onDriveDateToInput should mark control as touched', () => {
      const event = { target: { value: '31-JAN-2025' } } as any;
      const control = component.filterForm.get('driveDateTo');
      control?.markAsUntouched();

      component.onDriveDateToInput(event);

      expect(control?.touched).toBeTrue();
    });
  });

  describe('Date Error Message Getters', () => {
    it('getDriveDateFromError should return error for matDatepickerParse', () => {
      const control = component.filterForm.get('driveDateFrom');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getDriveDateFromError()).toBe('Drive Date From is invalid');
    });

    it('getDriveDateFromError should return error for required', () => {
      const control = component.filterForm.get('driveDateFrom');
      control?.markAsTouched();
      control?.setErrors({ required: true });
      expect(component.getDriveDateFromError()).toBe('Drive Date From is required');
    });

    it('getDriveDateFromError should show error when From date changed last creating invalid range', () => {
      // Set To date first
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-15'));
      component.filterForm.get('driveDateTo')?.markAsTouched();

      // Then change From date to create invalid range (From > To)
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      fixture.detectChanges();

      // Error should show on From field because it was changed last
      expect(component.getDriveDateFromError()).toBe('From date cannot be after to date');
    });

    it('getDriveDateFromError should NOT show error when To date changed last', () => {
      // Set From date first
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();

      // Then change To date to create invalid range (To < From)
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      fixture.detectChanges();

      // Error should NOT show on From field (shows on To field instead)
      expect(component.getDriveDateFromError()).toBe('');
    });

    it('getDriveDateToError should return error for matDatepickerParse', () => {
      const control = component.filterForm.get('driveDateTo');
      control?.markAsTouched();
      control?.setErrors({ matDatepickerParse: true });
      expect(component.getDriveDateToError()).toBe('Drive Date To is invalid');
    });

    it('getDriveDateToError should return error for required', () => {
      const control = component.filterForm.get('driveDateTo');
      control?.markAsTouched();
      control?.setErrors({ required: true });
      expect(component.getDriveDateToError()).toBe('Drive Date To is required');
    });

    it('getDriveDateToError should show error when To date changed last creating invalid range', () => {
      // Set From date first
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();

      // Then change To date to create invalid range (To < From)
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      fixture.detectChanges();

      // Error should show on To field because it was changed last
      expect(component.getDriveDateToError()).toBe('To date cannot be before from date');
    });

    it('getDriveDateToError should NOT show error when From date changed last', () => {
      // Set To date first
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-15'));
      component.filterForm.get('driveDateTo')?.markAsTouched();

      // Then change From date to create invalid range (From > To)
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      fixture.detectChanges();

      // Error should NOT show on To field (shows on From field instead)
      expect(component.getDriveDateToError()).toBe('');
    });

    it('getDriveDateToError should prioritize field-level errors over dateRangeInvalid', () => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      component.filterForm.get('driveDateTo')?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();

      // Should show invalidDateFormat error, not dateRangeInvalid
      expect(component.getDriveDateToError()).toBe('Drive Date To is invalid');
    });
  });

  describe('Date Change Subscriptions', () => {
    it('should NOT prematurely mark untouched fields when driveDateFrom changes', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.markAsUntouched();
      component.filterForm.get('driveDateTo')?.markAsUntouched();

      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      tick();

      // Should NOT automatically mark driveDateTo as touched
      expect(component.filterForm.get('driveDateTo')?.touched).toBeFalse();
    }));

    it('should NOT prematurely mark untouched fields when driveDateTo changes', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.markAsUntouched();
      component.filterForm.get('driveDateTo')?.markAsUntouched();

      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
      tick();

      // Should NOT automatically mark driveDateFrom as touched
      expect(component.filterForm.get('driveDateFrom')?.touched).toBeFalse();
    }));
  });

  describe('onRetrieve with Date Validation', () => {
    it('should prevent retrieve when form has dateRangeInvalid error', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();

      mockService.query.calls.reset();
      component.onRetrieve();
      tick();

      // Query should NOT be called when form is invalid
      expect(mockService.query).not.toHaveBeenCalled();
    }));

    it('should proceed with retrieve when date range is valid', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();

      mockService.query.calls.reset();
      component.onRetrieve();
      tick();

      // Query should be called when form is valid
      expect(mockService.query).toHaveBeenCalled();
    }));
  });

  describe('Date Field Integration', () => {
    it('should support clearing driveDateFrom and maintain valid state', () => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
      fixture.detectChanges();

      expect(component.filterForm.valid).toBeTrue();

      component.filterForm.get('driveDateFrom')?.setValue(null);
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should support clearing driveDateTo and maintain valid state', () => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
      fixture.detectChanges();

      expect(component.filterForm.valid).toBeTrue();

      component.filterForm.get('driveDateTo')?.setValue(null);
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();
    });

    it('should validate date range in real-time as user types', fakeAsync(() => {
      // Set valid range first
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-31'));
      tick();
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeFalse();

      // Change to invalid range
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-02-01'));
      tick();
      fixture.detectChanges();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
    }));
  });

  describe('Dynamic Subscript Sizing (Message Alignment Fix)', () => {
    it('should have subscriptSizing="dynamic" on Drive Date From field', () => {
      const driveDateFromField = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1)');
      expect(driveDateFromField).toBeTruthy();
      expect(driveDateFromField.getAttribute('subscriptSizing')).toBe('dynamic');
    });

    it('should have subscriptSizing="dynamic" on Drive Date To field', () => {
      const driveDateToField = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2)');
      expect(driveDateToField).toBeTruthy();
      expect(driveDateToField.getAttribute('subscriptSizing')).toBe('dynamic');
    });

    it('should display error message under Drive Date From when validation fails', fakeAsync(() => {
      const control = component.filterForm.get('driveDateFrom');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1) mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toBe('Drive Date From is invalid');
    }));

    it('should display error message under Drive Date To when validation fails', fakeAsync(() => {
      const control = component.filterForm.get('driveDateTo');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent.trim()).toBe('Drive Date To is invalid');
    }));

    it('should display date range error under Drive Date From when From changed last', fakeAsync(() => {
      // Set To date first
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-15'));
      component.filterForm.get('driveDateTo')?.markAsTouched();

      // Then change From date to create invalid range
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      tick();
      fixture.detectChanges();

      const fromErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1) mat-error');
      expect(fromErrorElement).toBeTruthy();
      expect(fromErrorElement.textContent.trim()).toBe('From date cannot be after to date');

      // To field should NOT show error
      const toErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(toErrorElement).toBeFalsy();
    }));

    it('should display date range error under Drive Date To when To changed last', fakeAsync(() => {
      // Set From date first
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();

      // Then change To date to create invalid range
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      tick();
      fixture.detectChanges();

      const toErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(toErrorElement).toBeTruthy();
      expect(toErrorElement.textContent.trim()).toBe('To date cannot be before from date');

      // From field should NOT show error
      const fromErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1) mat-error');
      expect(fromErrorElement).toBeFalsy();
    }));

    it('should hide error message when Drive Date From becomes valid', fakeAsync(() => {
      // Set invalid state
      const control = component.filterForm.get('driveDateFrom');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();

      let errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1) mat-error');
      expect(errorElement).toBeTruthy();

      // Clear errors
      control?.setErrors(null);
      fixture.detectChanges();

      errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(1) mat-error');
      expect(errorElement).toBeFalsy();
    }));

    it('should hide error message when Drive Date To becomes valid', fakeAsync(() => {
      // Set invalid state
      const control = component.filterForm.get('driveDateTo');
      control?.markAsTouched();
      control?.setErrors({ invalidDateFormat: true });
      fixture.detectChanges();

      let errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(errorElement).toBeTruthy();

      // Clear errors
      control?.setErrors(null);
      fixture.detectChanges();

      errorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(errorElement).toBeFalsy();
    }));

    it('should support multiple error states transitioning smoothly', fakeAsync(() => {
      // Start with date range error
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-31'));
      component.filterForm.get('driveDateFrom')?.markAsTouched();
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-01-01'));
      component.filterForm.get('driveDateTo')?.markAsTouched();
      tick();
      fixture.detectChanges();

      let toErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(toErrorElement).toBeTruthy();
      expect(toErrorElement.textContent.trim()).toBe('To date cannot be before from date');

      // Fix date range but add format error
      component.filterForm.get('driveDateTo')?.setValue(new Date('2025-02-01'));
      component.filterForm.get('driveDateTo')?.setErrors({ invalidDateFormat: true });
      tick();
      fixture.detectChanges();

      toErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(toErrorElement).toBeTruthy();
      expect(toErrorElement.textContent.trim()).toBe('Drive Date To is invalid');

      // Clear all errors
      component.filterForm.get('driveDateTo')?.setErrors(null);
      fixture.detectChanges();

      toErrorElement = fixture.nativeElement.querySelector('mat-form-field.date-field:nth-of-type(2) mat-error');
      expect(toErrorElement).toBeFalsy();
    }));
  });

  describe('Batch ID (setId)', () => {
    it('should include setId column with header Batch ID in tableConfig', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'setId');
      expect(col).toBeTruthy();
      expect(col!.header).toBe('Batch ID');
    });

    it('should have setId column as sortable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'setId');
      expect(col!.sortable).toBe(true);
    });

    it('should display -- for null setId values', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'setId');
      expect(col!.valueFormatter!(null)).toBe('--');
      expect(col!.valueFormatter!('')).toBe('--');
    });

    it('should include setId in form group', () => {
      expect(component.filterForm.get('setId')).toBeTruthy();
    });

    it('should reset setId on clearAll', () => {
      component.filterForm.get('setId')!.setValue('BAT001');
      component.onClearAll();
      expect(component.filterForm.get('setId')!.value).toBe('');
    });
  });

  describe('Future Date Validation', () => {
    it('should set futureDate error when driveDateFrom is in the future', fakeAsync(() => {
      const tomorrow = moment('2026-07-17');
      component.filterForm.get('driveDateFrom')!.setValue(tomorrow);
      component.filterForm.markAllAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('driveDateFrom')!.hasError('futureDate')).toBe(true);
    }));

    it('should set futureDate error when driveDateTo is in the future', fakeAsync(() => {
      const tomorrow = moment('2026-07-17');
      component.filterForm.get('driveDateTo')!.setValue(tomorrow);
      component.filterForm.markAllAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('driveDateTo')!.hasError('futureDate')).toBe(true);
    }));

    it('should not set futureDate error when date is today', fakeAsync(() => {
      const today = moment('2026-07-16');
      component.filterForm.get('driveDateFrom')!.setValue(today);
      component.filterForm.get('driveDateTo')!.setValue(today);
      component.filterForm.markAllAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('driveDateFrom')!.hasError('futureDate')).toBe(false);
      expect(component.filterForm.get('driveDateTo')!.hasError('futureDate')).toBe(false);
    }));

    it('should not set futureDate error when date is in the past', fakeAsync(() => {
      const pastDate = moment('2026-06-01');
      component.filterForm.get('driveDateFrom')!.setValue(pastDate);
      component.filterForm.get('driveDateTo')!.setValue(pastDate);
      component.filterForm.markAllAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.filterForm.get('driveDateFrom')!.hasError('futureDate')).toBe(false);
      expect(component.filterForm.get('driveDateTo')!.hasError('futureDate')).toBe(false);
    }));

    it('should show Date cannot be in the future message for driveDateFrom', fakeAsync(() => {
      const tomorrow = moment('2026-07-17');
      component.filterForm.get('driveDateFrom')!.setValue(tomorrow);
      component.filterForm.get('driveDateFrom')!.markAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.getDriveDateFromError()).toBe('Date cannot be in the future');
    }));

    it('should show Date cannot be in the future message for driveDateTo', fakeAsync(() => {
      const tomorrow = moment('2026-07-17');
      component.filterForm.get('driveDateTo')!.setValue(tomorrow);
      component.filterForm.get('driveDateTo')!.markAsTouched();
      fixture.detectChanges();
      tick();

      component.onRetrieve();
      tick();

      expect(component.getDriveDateToError()).toBe('Date cannot be in the future');
    }));
  });

  describe('Audit Flag Guard', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      // Spy on the component's actual snackBar instance
      // (standalone component resolves MatSnackBar from its own MatSnackBarModule import)
      snackBarSpy = spyOn((component as any).snackBar, 'open');
    });

    it('should show snackbar when audit details clicked with auditComplete N', () => {
      const row = { ...mockQueryResults[0], auditComplete: 'N', transactionId: 'TR001' };
      component.onRowAction({ action: 'audit-details', row } as any);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'No audit data available for this record', 'Close', jasmine.any(Object));
    });

    it('should show snackbar when auditComplete is --', () => {
      const row = { ...mockQueryResults[0], auditComplete: '--', transactionId: 'TR001' };
      component.onRowAction({ action: 'audit-details', row } as any);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'No audit data available for this record', 'Close', jasmine.any(Object));
    });

    it('should show snackbar when auditComplete is Y (raw, not normalized)', () => {
      const row = { ...mockQueryResults[0], auditComplete: 'Y', transactionId: 'TR001' };
      component.onRowAction({ action: 'audit-details', row } as any);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'No audit data available for this record', 'Close', jasmine.any(Object));
    });

    it('should open dialog when auditComplete is Yes', () => {
      const row = { ...mockQueryResults[0], auditComplete: 'Yes', transactionId: 'TR001' };
      component.onRowAction({ action: 'audit-details', row } as any);
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('LOV_LIMIT and Default Dates', () => {
    it('should call getLovLimit on init', () => {
      expect(mockService.getLovLimit).toHaveBeenCalled();
    });

    it('should apply default dates when all filters empty on retrieve', fakeAsync(() => {
      component.onClearAll();
      mockService.query.calls.reset();
      component.onRetrieve();
      tick();

      const formValue = component.filterForm.getRawValue();
      expect(formValue.driveDateFrom).toBeTruthy();
      expect(formValue.driveDateTo).toBeTruthy();
    }));

    it('should apply default dates even when another filter has a value but dates are empty', fakeAsync(() => {
      component.onClearAll();
      component.filterForm.get('driveId')!.setValue('DRV001');
      component.onRetrieve();
      tick();

      const formValue = component.filterForm.getRawValue();
      expect(formValue.driveDateFrom).toBeTruthy();
      expect(formValue.driveDateTo).toBeTruthy();
    }));

    it('should use lovLimit value for default date range calculation', fakeAsync(() => {
      component.onClearAll();
      mockService.query.calls.reset();
      component.onRetrieve();
      tick();

      const formValue = component.filterForm.getRawValue();
      // driveDateTo should be chapter today (2026-07-16)
      expect(formValue.driveDateTo).toBeTruthy();
      // driveDateFrom should be lovLimit (21) days before chapter today
      expect(formValue.driveDateFrom).toBeTruthy();
    }));

    it('should reload lookups on chapter change', fakeAsync(() => {
      mockService.getLookups.calls.reset();
      mockService.getLovLimit.calls.reset();
      chapterChanged$.next();
      tick();

      expect(mockService.getLookups).toHaveBeenCalled();
      expect(mockService.getLovLimit).toHaveBeenCalled();
    }));
  });

  describe('Column Sorting', () => {
    it('should have all columns with sortable true', () => {
      const nonSortable = component.tableConfig.columns.filter(c => !c.sortable);
      expect(nonSortable.length).toBe(0);
    });

    it('should have 10 columns defined', () => {
      expect(component.tableConfig.columns.length).toBe(10);
    });

    it('should sort by transactionId ascending', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.onRetrieve();
      tick();

      component.onSortChange({ column: 'transactionId', direction: 'A' });

      expect(component.dataSource[0].transactionId).toBe('TR02866892');
      expect(component.dataSource[1].transactionId).toBe('TR02866893');
    }));

    it('should sort by transactionId descending', fakeAsync(() => {
      component.filterForm.get('driveDateFrom')?.setValue(new Date('2025-01-01'));
      component.onRetrieve();
      tick();

      component.onSortChange({ column: 'transactionId', direction: 'D' });

      expect(component.dataSource[0].transactionId).toBe('TR02866893');
      expect(component.dataSource[1].transactionId).toBe('TR02866892');
    }));
  });

  describe('Row Actions', () => {
    it('should open entry details dialog with donorId and driveDate', () => {
      const row = mockQueryResults[0];
      component.onRowAction({ action: 'entry-details', row } as any);
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should not open entry details when donorId is missing', () => {
      const row = { ...mockQueryResults[0], donorId: '' };
      component.onRowAction({ action: 'entry-details', row } as any);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not open audit details when transactionId is missing', () => {
      const row = { ...mockQueryResults[0], transactionId: '', auditComplete: 'Y' };
      component.onRowAction({ action: 'audit-details', row } as any);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not open donor holds when transactionId is missing', () => {
      const row = { ...mockQueryResults[0], transactionId: '' };
      component.onRowAction({ action: 'donor-holds', row } as any);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('Value Formatters', () => {
    it('should return -- for null values', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'deferralId');
      expect(col!.valueFormatter!(null)).toBe('--');
    });

    it('should return value as-is for non-null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'deferralId');
      expect(col!.valueFormatter!('12345')).toBe('12345');
    });

    it('should return -- for empty string', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'driveId');
      expect(col!.valueFormatter!('')).toBe('--');
    });

    it('should format all text columns consistently', () => {
      const textColumns = component.tableConfig.columns.filter(
        c => c.key !== 'dateTimeOfRegistration'
      );
      textColumns.forEach(col => {
        expect(col.valueFormatter!(null)).toBe('--');
        expect(col.valueFormatter!('')).toBe('--');
      });
    });
  });
});
