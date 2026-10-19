import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SeparationTimesOfflineComponent } from './separation-times-offline';
import { SeparationTimesOfflineApiService } from './services/separation-times-offline-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TablePageEvent } from '@shared/interfaces/data-table.interface';
import { createMockActivatedRoute, createMockHeaderService, createMockMatSnackBar, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  CentrifugeDto,
  ValidateUnitResponseDto,
  SeparationTimesOfflineDto,
} from './models/separation-times-offline.model';

describe('SeparationTimesOfflineComponent', () => {
  let snackbarRef: any;
  let component: SeparationTimesOfflineComponent;
  let fixture: ComponentFixture<SeparationTimesOfflineComponent>;
  let apiServiceSpy: jasmine.SpyObj<SeparationTimesOfflineApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let matSnackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChangedSubject: Subject<void>;

  const mockCentrifuges: CentrifugeDto[] = [
    { centrifugeId: 'B01', manufacturer: 'Centrifuge B01' },
    { centrifugeId: 'B02', manufacturer: 'Centrifuge B02' },
  ];

  const mockValidateResponse: ValidateUnitResponseDto = {
    unitId: 'W123456789',
    collDate: '2024-06-01T00:00:00Z',
    bleedStartTime: '2024-06-01T08:30:00Z',
    bleedEndTime: '2024-06-01T08:45:00Z',
    firstSepTime: null,
    secondSepTime: null,
    canRecordFirst: true,
    canRecordSecond: false,
    firstSepDuration: null,
    secondSepDuration: null,
  };

  const mockSeparationResponse: SeparationTimesOfflineDto = {
    unitId: 'W123456789',
    collDate: '2024-06-01T00:00:00Z',
    chapterId: 'CHAP01',
    bleedStartTime: '2024-06-01T08:30:00Z',
    bleedEndTime: '2024-06-01T08:45:00Z',
    firstSepTime: '2024-06-01T09:15:00Z',
    firstSepCentrifugeId: 'B01',
    firstSepDuration: '00:45',
    secondSepTime: null,
    secondSepCentrifugeId: null,
    secondSepDuration: null,
    canRecordFirst: false,
    canRecordSecond: true,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('SeparationTimesOfflineApiService', [
      'getCentrifuges',
      'validateUnit',
      'recordFirstSeparation',
      'recordSecondSeparation',
      'getSeparationDetails',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    chapterChangedSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    matSnackBarSpy = createMockMatSnackBar();

    apiServiceSpy.getCentrifuges.and.returnValue(of(mockCentrifuges));
    apiServiceSpy.validateUnit.and.returnValue(of(mockValidateResponse));
    apiServiceSpy.recordFirstSeparation.and.returnValue(of(mockSeparationResponse));

    TestBed.configureTestingModule({
      imports: [SeparationTimesOfflineComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SeparationTimesOfflineApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });

    apiServiceSpy.getCentrifuges.and.returnValue(of(mockCentrifuges));
    apiServiceSpy.validateUnit.and.returnValue(of(mockValidateResponse));
    apiServiceSpy.recordFirstSeparation.and.returnValue(of(mockSeparationResponse));

    fixture = TestBed.createComponent(SeparationTimesOfflineComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load centrifuges on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getCentrifuges).toHaveBeenCalled();
      expect(component.centrifuges()).toEqual(mockCentrifuges);
    }));

    it('should initialize form with default values', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('processDate')?.value).toBeNull();
      expect(component.filterForm.get('time')?.value).toBe('');
      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBe('');
    }));

    it('should set header config from pageHeaderService data', fakeAsync(() => {
      (pageHeaderServiceSpy as any).pageHeaderData.and.returnValue({ title: 'Custom Title', subtitle: 'Sub' });
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Custom Title');
      expect(component.headerConfig.subtitle).toBe('Sub');
    }));

    it('should use default title when pageHeaderData has no title', fakeAsync(() => {
      (pageHeaderServiceSpy as any).pageHeaderData.and.returnValue({ title: '', subtitle: '' });
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Separation Times Offline');
    }));

    it('should update Unit ID column header with count when entries exist', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
        { unitId: 'B', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      fixture.detectChanges();
      tick();

      const unitIdCol = component.dataTableConfig.columns.find((c) => c.key === 'unitId');
      expect(unitIdCol?.header).toBe('Unit ID (2)');
    }));

    it('should reset Unit ID column header when entries are empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.entries.set([]);
      fixture.detectChanges();
      tick();

      const unitIdCol = component.dataTableConfig.columns.find((c) => c.key === 'unitId');
      expect(unitIdCol?.header).toBe('Unit ID');
    }));
  });

  describe('Loading State', () => {
    it('should handle centrifuge loading error with error code format', fakeAsync(() => {
      apiServiceSpy.getCentrifuges.and.returnValue(
        throwError(() => ({
          error: { errorCode: '1142', error: 'No centrifuges found' },
        }))
      );
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 1142: No centrifuges found');
    }));

    it('should handle centrifuge loading error without error code', fakeAsync(() => {
      apiServiceSpy.getCentrifuges.and.returnValue(
        throwError(() => ({
          error: { message: 'Network error' },
        }))
      );
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should set isLoadingCentrifuges to false after successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isLoadingCentrifuges()).toBeFalse();
    }));

    it('should set isLoadingCentrifuges to false after failed load', fakeAsync(() => {
      apiServiceSpy.getCentrifuges.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component.isLoadingCentrifuges()).toBeFalse();
    }));
  });

  describe('Unit Validation via app-unit-id-field', () => {
    it('should allow same unit ID to be scanned again (no duplicate check)', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.entries.set([
        {
          unitId: 'W123456789',
          collectionDate: '01-JUN-2024',
          processDate: '01-JUN-2024 09:15',
          centrifugeId: 'B01',
          firstSeparationTime: '00:45',
          secondSeparationTime: '-',
        },
      ]);

      const mockEvent = {
        data: { parsedUnitId: 'W123456789' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W123456789');
      expect(mockEvent.confirm).toHaveBeenCalled();
    }));

    it('should confirm valid unit in postValidate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockEvent = {
        data: { parsedUnitId: 'W123456789' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W123456789');
      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(component.currentUnitData()).toEqual(mockValidateResponse);
    }));

    it('should reject when both separations already recorded', fakeAsync(() => {
      const bothRecordedResponse: ValidateUnitResponseDto = {
        ...mockValidateResponse,
        canRecordFirst: false,
        canRecordSecond: false,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(bothRecordedResponse));

      fixture.detectChanges();
      tick();

      const mockEvent = {
        data: { parsedUnitId: 'W123456789' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('No more separation times can be entered for this unit');
    }));

    it('should reject with error code format on API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({
          error: { errorCode: '0095', error: 'Pheresis units not allowed' },
        }))
      );

      fixture.detectChanges();
      tick();

      const mockEvent = {
        data: { parsedUnitId: 'P987654321' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Error 0095: Pheresis units not allowed');
    }));

    it('should reject with fallback message on generic API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => ({})));

      fixture.detectChanges();
      tick();

      const mockEvent = {
        data: { parsedUnitId: 'W111111111' } as any,
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Failed to validate unit');
    }));
  });

  describe('Unit Validated and Cleared', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set process date and time on unit validated', () => {
      component.onUnitValidated({} as any);
      expect(component.filterForm.get('processDate')?.value).toBeTruthy();
      expect(component.filterForm.get('time')?.value).toMatch(/\d{2}:\d{2}/);
    });

    it('should use chapter timezone when available', () => {
      (headerServiceSpy as any).chapterTimeZone = signal('+05:30');
      component.onUnitValidated({} as any);
      expect(component.filterForm.get('time')?.value).toMatch(/\d{2}:\d{2}/);
    });

    it('should use local time when no chapter timezone', () => {
      (headerServiceSpy as any).chapterTimeZone = signal(null);
      component.onUnitValidated({} as any);
      expect(component.filterForm.get('time')?.value).toMatch(/\d{2}:\d{2}/);
    });

    it('should clear fields on unit cleared', () => {
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.get('processDate')?.setValue(new Date());
      component.filterForm.get('time')?.setValue('10:00');

      component.onUnitCleared();

      expect(component.filterForm.get('processDate')?.value).toBeNull();
      expect(component.filterForm.get('time')?.value).toBe('');
      expect(component.currentUnitData()).toBeNull();
    });
  });

  describe('Separation Recording', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });
    }));

    it('should record first separation successfully', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick();

      expect(apiServiceSpy.recordFirstSeparation).toHaveBeenCalled();
      expect(component.entries().length).toBe(1);
    }));

    it('should set invalidTime error for bad time format', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.filterForm.get('time')?.setValue('25:00');

      component.onRecordSeparation();

      expect(component.filterForm.get('time')?.hasError('invalidTime')).toBeTrue();
      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    });

    it('should send process date as local datetime, not UTC', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick();

      const callArgs = apiServiceSpy.recordFirstSeparation.calls.mostRecent()?.args[0];
      expect(callArgs.processDate).not.toContain('Z');
      expect(callArgs.processDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    }));

    it('should not record when already processing', () => {
      component.isProcessing.set(true);
      component.onRecordSeparation();
      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    });

    it('should not record when no unit data', () => {
      component.currentUnitData.set(null);
      component.onRecordSeparation();
      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    });

    it('should not record when unitIdField is not valid', () => {
      (component as any).unitIdField = { isValid: false, parsedUnitId: 'W123456789' };
      component.onRecordSeparation();
      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    });

    it('should show error when fields are missing', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({ processDate: null, time: '', recordingCentrifugeId: '' });
      component.onRecordSeparation();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should show error when unitId is missing', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: '' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });
      component.onRecordSeparation();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should set invalidCentrifuge error for unknown centrifuge', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: '09:15',
        recordingCentrifugeId: 'UNKNOWN',
      });
      component.onRecordSeparation();
      expect(component.filterForm.get('recordingCentrifugeId')?.hasError('invalidCentrifuge')).toBeTrue();
    });

    it('should set invalidTime error for malformed time without colon', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: 'abc',
        recordingCentrifugeId: 'B01',
      });
      component.onRecordSeparation();
      expect(component.filterForm.get('time')?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime error for NaN hours/minutes', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: 'ab:cd',
        recordingCentrifugeId: 'B01',
      });
      component.onRecordSeparation();
      expect(component.filterForm.get('time')?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime error for minutes out of range', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: '10:60',
        recordingCentrifugeId: 'B01',
      });
      component.onRecordSeparation();
      expect(component.filterForm.get('time')?.hasError('invalidTime')).toBeTrue();
    });

    it('should set invalidTime error for negative hours', () => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789' };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01'),
        time: '-1:00',
        recordingCentrifugeId: 'B01',
      });
      component.onRecordSeparation();
      expect(component.filterForm.get('time')?.hasError('invalidTime')).toBeTrue();
    });

    it('should record second separation when canRecordFirst is false', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      const secondResponse = { ...mockSeparationResponse, secondSepTime: '2024-06-01T10:00:00Z', secondSepDuration: '01:15' };
      apiServiceSpy.recordSecondSeparation.and.returnValue(of(secondResponse));

      const secondValidate = { ...mockValidateResponse, canRecordFirst: false, canRecordSecond: true };
      component.currentUnitData.set(secondValidate);
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      expect(apiServiceSpy.recordSecondSeparation).toHaveBeenCalled();
      expect(component.entries().length).toBe(1);
    }));

    it('should handle recording API error', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });
      apiServiceSpy.recordFirstSeparation.and.returnValue(
        throwError(() => ({
          error: { errorCode: '0099', error: 'Recording failed' },
        }))
      );

      component.onRecordSeparation();
      tick();

      expect(component.isProcessing()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0099: Recording failed');
    }));

    it('should handle recording API error without error code', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });
      apiServiceSpy.recordFirstSeparation.and.returnValue(throwError(() => ({})));

      component.onRecordSeparation();
      tick();

      expect(component.isProcessing()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to record separation time. Please try again.');
    }));

    it('should build entry with firstSepTime when firstSepDuration is null', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      const responseNoDuration = {
        ...mockSeparationResponse,
        firstSepDuration: null,
        firstSepTime: '2024-06-01T09:15:00Z',
      };
      apiServiceSpy.recordFirstSeparation.and.returnValue(of(responseNoDuration));

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick();

      const entry = component.entries()[0];
      expect(entry.firstSeparationTime).toMatch(/JUN/i);
    }));

    it('should build entry with dash when both firstSepDuration and firstSepTime are null', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      const responseNoFirst = {
        ...mockSeparationResponse,
        firstSepDuration: null,
        firstSepTime: null,
      };
      apiServiceSpy.recordFirstSeparation.and.returnValue(of(responseNoFirst));

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick();

      const entry = component.entries()[0];
      expect(entry.firstSeparationTime).toBe('-');
    }));

    it('should build entry with secondSepTime when secondSepDuration is null', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      const responseWithSecondTime = {
        ...mockSeparationResponse,
        secondSepDuration: null,
        secondSepTime: '2024-06-01T10:00:00Z',
      };
      apiServiceSpy.recordFirstSeparation.and.returnValue(of(responseWithSecondTime));

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick();

      const entry = component.entries()[0];
      expect(entry.secondSeparationTime).toMatch(/JUN/i);
    }));

    it('should reset entry fields after successful recording', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };

      component.onRecordSeparation();
      tick(200);

      expect(component.filterForm.get('processDate')?.value).toBeNull();
      expect(component.filterForm.get('time')?.value).toBe('');
      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBe('');
      expect(component.currentUnitData()).toBeNull();
      expect((component as any).unitIdField.clear).toHaveBeenCalled();
    }));
  });

  describe('Process Date Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reject future dates', () => {
      component.filterForm.get('processDate')?.setValue(new Date('2099-12-31'));

      component.onProcessDateChange();

      expect(component.processDateError()).toBe('Process date cannot be in the future');
    });

    it('should not reject future date when processDate is null', () => {
      component.filterForm.get('processDate')?.setValue(null);
      component.onProcessDateChange();
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    });

    it('should accept past dates without error', () => {
      component.filterForm.get('processDate')?.setValue(new Date('2020-01-01'));
      component.onProcessDateChange();
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
      expect(component.filterForm.get('processDate')?.value).toBeTruthy();
    });

    it('should reject future process datetime in onRecordSeparation', fakeAsync(() => {
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2099-12-31T23:59:00'),
        time: '23:59',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process date cannot be in the future');
    }));
  });

  describe('Centrifuge Input and Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all centrifuges when search is empty', () => {
      (component as any).recordingCentrifugeSearch.set('');
      expect(component.filteredRecordingCentrifuges().length).toBe(2);
    });

    it('should filter centrifuges by search term', () => {
      (component as any).recordingCentrifugeSearch.set('B01');
      const filtered = component.filteredRecordingCentrifuges();
      expect(filtered.length).toBe(1);
      expect(filtered[0].centrifugeId).toBe('B01');
    });

    it('should filter centrifuges by manufacturer', () => {
      (component as any).recordingCentrifugeSearch.set('B02');
      const filtered = component.filteredRecordingCentrifuges();
      expect(filtered.length).toBe(1);
    });

    it('should filter centrifuges by manufacturer with null manufacturer', () => {
      component.centrifuges.set([
        { centrifugeId: 'C01', manufacturer: null },
        { centrifugeId: 'B01', manufacturer: 'MFG' },
      ]);
      (component as any).recordingCentrifugeSearch.set('C01');
      const filtered = component.filteredRecordingCentrifuges();
      expect(filtered.length).toBe(1);
      expect(filtered[0].centrifugeId).toBe('C01');
    });

    it('should uppercase input on centrifuge input', () => {
      const input = { value: 'b01', selectionStart: 3, setSelectionRange: jasmine.createSpy() } as any;
      const event = { target: input } as any;
      component.onRecordingCentrifugeInput(event);
      expect(input.value).toBe('B01');
      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBe('B01');
    });

    it('should handle null selectionStart on centrifuge input', () => {
      const input = { value: 'b01', selectionStart: null, setSelectionRange: jasmine.createSpy() } as any;
      const event = { target: input } as any;
      component.onRecordingCentrifugeInput(event);
      expect(input.value).toBe('B01');
      expect(input.setSelectionRange).not.toHaveBeenCalled();
    });

    it('should handle empty input value on centrifuge input', () => {
      const input = { value: '', selectionStart: 0, setSelectionRange: jasmine.createSpy() } as any;
      const event = { target: input } as any;
      component.onRecordingCentrifugeInput(event);
      expect(input.value).toBe('');
    });

    it('should set centrifuge and clear errors on selection', () => {
      const event = { option: { value: 'B01' } } as any;
      component.onRecordingCentrifugeSelected(event);
      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBe('B01');
      expect(component.filterForm.get('recordingCentrifugeId')?.errors).toBeNull();
    });

    it('should auto-save on centrifuge selected when all fields filled', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
      });

      const event = { option: { value: 'B01' } } as any;
      component.onRecordingCentrifugeSelected(event);
      tick();

      expect(apiServiceSpy.recordFirstSeparation).toHaveBeenCalled();
    }));

    it('should not auto-save on centrifuge selected when no unit data', fakeAsync(() => {
      component.currentUnitData.set(null);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
      });

      const event = { option: { value: 'B01' } } as any;
      component.onRecordingCentrifugeSelected(event);
      tick();

      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    }));

    it('should not auto-save when time field is empty', fakeAsync(() => {
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '',
      });

      const event = { option: { value: 'B01' } } as any;
      component.onRecordingCentrifugeSelected(event);
      tick();

      expect(apiServiceSpy.recordFirstSeparation).not.toHaveBeenCalled();
    }));

    it('should set invalidCentrifuge error on blur with non-matching text', fakeAsync(() => {
      component.filterForm.get('recordingCentrifugeId')?.setValue('INVALID');
      component.onRecordingCentrifugeBlur();
      tick(250);
      expect(component.filterForm.get('recordingCentrifugeId')?.hasError('invalidCentrifuge')).toBeTrue();
    }));

    it('should validate and set centrifuge on blur with matching value', fakeAsync(() => {
      component.filterForm.get('recordingCentrifugeId')?.setValue('b01');
      component.onRecordingCentrifugeBlur();
      tick(250);
      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBe('B01');
    }));

    it('should not validate on blur when ctrl has existing errors', fakeAsync(() => {
      component.filterForm.get('recordingCentrifugeId')?.setErrors({ required: true });
      component.filterForm.get('recordingCentrifugeId')?.setValue('B01');
      component.filterForm.get('recordingCentrifugeId')?.setErrors({ someError: true });
      component.onRecordingCentrifugeBlur();
      tick(250);
      expect(component.filterForm.get('recordingCentrifugeId')?.errors).toBeTruthy();
    }));

    it('should skip validation on blur when value is empty', fakeAsync(() => {
      component.filterForm.get('recordingCentrifugeId')?.setValue('');
      component.filterForm.get('recordingCentrifugeId')?.setErrors(null);
      component.onRecordingCentrifugeBlur();
      tick(250);
      expect(component.filterForm.get('recordingCentrifugeId')?.hasError('invalidCentrifuge')).toBeFalse();
    }));

    it('should trigger auto-save on blur with valid centrifuge and all fields filled', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'b01',
      });

      component.onRecordingCentrifugeBlur();
      tick(250);

      expect(apiServiceSpy.recordFirstSeparation).toHaveBeenCalled();
    }));
  });

  describe('Data Table', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display entries in table', fakeAsync(() => {
      component.entries.set([
        {
          unitId: 'W123456789',
          collectionDate: '01-JUN-2024',
          processDate: '01-JUN-2024 09:15',
          centrifugeId: 'B01',
          firstSeparationTime: '00:45',
          secondSeparationTime: '-',
        },
      ]);
      fixture.detectChanges();

      expect(component.displayData().length).toBe(1);
    }));

    it('should handle page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(1);
      expect(component.dataTableConfig.pagination?.pageSize).toBe(25);
    });

    it('should handle sort change', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.dataTableConfig.sortConfig?.column).toBe('unitId');
      expect(component.dataTableConfig.sortConfig?.direction).toBe('A');
    });

    it('should sort data in ascending order', () => {
      component.entries.set([
        { unitId: 'B', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      component.onSortChange({ column: 'unitId', direction: 'A' });
      const data = component.displayData();
      expect(data[0].unitId).toBe('A');
    });

    it('should sort data in descending order', () => {
      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
        { unitId: 'B', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      component.onSortChange({ column: 'unitId', direction: 'D' });
      const data = component.displayData();
      expect(data[0].unitId).toBe('B');
    });

    it('should reset sort on default direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'default' });
      const data = component.displayData();
      expect(data).toBeDefined();
    });

    it('should sort equal values correctly', () => {
      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      component.onSortChange({ column: 'unitId', direction: 'A' });
      const data = component.displayData();
      expect(data.length).toBe(2);
    });

    it('should handle sorting with null/undefined values', () => {
      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
        { unitId: 'B', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      component.onSortChange({ column: 'nonExistentCol' as any, direction: 'A' });
      const data = component.displayData();
      expect(data.length).toBe(2);
    });
  });

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear all form fields and entries', () => {
      component.filterForm.patchValue({
        recordingCentrifugeId: 'B01',
      });
      component.entries.set([
        {
          unitId: 'W123456789',
          collectionDate: '01-JUN-2024',
          processDate: '01-JUN-2024 09:15',
          centrifugeId: 'B01',
          firstSeparationTime: '00:45',
          secondSeparationTime: '-',
        },
      ]);

      component.clearAll();

      expect(component.filterForm.get('recordingCentrifugeId')?.value).toBeNull();
      expect(component.entries().length).toBe(0);
      expect(component.currentUnitData()).toBeNull();
      expect(component.error()).toBeNull();
    });

    it('should dismiss snackbar on clearAll', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      component.clearAll();

      expect(snackbarRef.dismiss).toHaveBeenCalled();
    }));
  });

  describe('Chapter Changes', () => {
    it('should reload centrifuges when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      chapterChangedSubject.next();
      tick();

      expect(apiServiceSpy.getCentrifuges).toHaveBeenCalled();
      expect(component.entries().length).toBe(0);
    }));

    it('should clear entries and unit data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      component.currentUnitData.set(mockValidateResponse);

      chapterChangedSubject.next();
      tick();

      expect(component.entries().length).toBe(0);
      expect(component.currentUnitData()).toBeNull();
    }));
  });

  describe('Snackbar', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show "1 Entry saved" for single entry', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      expect(matSnackBarSpy.open).toHaveBeenCalledWith('1 Entry saved', 'DISMISS', jasmine.any(Object));
    }));

    it('should show plural "Entries saved" message for multiple entries', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      expect(matSnackBarSpy.open).toHaveBeenCalledWith('2 Entries saved', 'DISMISS', jasmine.any(Object));
    }));

    it('should dismiss previous snackbar before showing new one', fakeAsync(() => {
      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef);

      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W123456789', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.currentUnitData.set(mockValidateResponse);
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T09:15:00'),
        time: '09:15',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      const firstRef = snackbarRef;
      const snackbarRef2 = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef2.onAction.and.returnValue(of(void 0));
      matSnackBarSpy.open.and.returnValue(snackbarRef2);

      component.currentUnitData.set(mockValidateResponse);
      (component as any).unitIdField = { isValid: true, parsedUnitId: 'W999999999', clear: jasmine.createSpy(), focus: jasmine.createSpy() };
      component.filterForm.patchValue({
        processDate: new Date('2024-06-01T10:00:00'),
        time: '10:00',
        recordingCentrifugeId: 'B01',
      });

      component.onRecordSeparation();
      tick();

      expect(firstRef.dismiss).toHaveBeenCalled();
    }));

    it('should not error when dismissing with no active snackbar', () => {
      (component as any).entrySavedSnackBarRef = null;
      expect(() => (component as any).dismissEntrySavedSnackbar()).not.toThrow();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute collectionDate from unitData', () => {
      component.currentUnitData.set(mockValidateResponse);
      expect(component.collectionDate()).toMatch(/JUN/i);
    });

    it('should return dash for collectionDate when no data', () => {
      component.currentUnitData.set(null);
      expect(component.collectionDate()).toBe('-');
    });

    it('should return dash for collectionDate when collDate is empty', () => {
      component.currentUnitData.set({ ...mockValidateResponse, collDate: '' });
      expect(component.collectionDate()).toBe('-');
    });

    it('should compute firstSeparationTime with duration', () => {
      component.currentUnitData.set({ ...mockValidateResponse, firstSepDuration: '00:45' });
      expect(component.firstSeparationTime()).toBe('00:45');
    });

    it('should compute firstSeparationTime from time when no duration', () => {
      component.currentUnitData.set({ ...mockValidateResponse, firstSepTime: '2024-06-01T09:15:00Z', firstSepDuration: null });
      expect(component.firstSeparationTime()).toMatch(/JUN/i);
    });

    it('should return dash for firstSeparationTime when no data', () => {
      component.currentUnitData.set(null);
      expect(component.firstSeparationTime()).toBe('-');
    });

    it('should return dash for firstSeparationTime when both null', () => {
      component.currentUnitData.set({ ...mockValidateResponse, firstSepTime: null, firstSepDuration: null });
      expect(component.firstSeparationTime()).toBe('-');
    });

    it('should compute secondSeparationTime with duration', () => {
      component.currentUnitData.set({ ...mockValidateResponse, secondSepDuration: '01:30' });
      expect(component.secondSeparationTime()).toBe('01:30');
    });

    it('should compute secondSeparationTime from time when no duration', () => {
      component.currentUnitData.set({ ...mockValidateResponse, secondSepTime: '2024-06-01T10:00:00Z', secondSepDuration: null });
      expect(component.secondSeparationTime()).toMatch(/JUN/i);
    });

    it('should return dash for secondSeparationTime when no data', () => {
      component.currentUnitData.set(null);
      expect(component.secondSeparationTime()).toBe('-');
    });

    it('should return dash for secondSeparationTime when both null', () => {
      component.currentUnitData.set({ ...mockValidateResponse, secondSepTime: null, secondSepDuration: null });
      expect(component.secondSeparationTime()).toBe('-');
    });

    it('should compute canRecordFirst and canRecordSecond', () => {
      component.currentUnitData.set(mockValidateResponse);
      expect(component.canRecordFirst()).toBeTrue();
      expect(component.canRecordSecond()).toBeFalse();
    });

    it('should return false for canRecordFirst when no data', () => {
      component.currentUnitData.set(null);
      expect(component.canRecordFirst()).toBeFalse();
      expect(component.canRecordSecond()).toBeFalse();
    });

    it('should compute entriesCount', () => {
      component.entries.set([
        { unitId: 'A', collectionDate: '', processDate: '', centrifugeId: '', firstSeparationTime: '', secondSeparationTime: '' },
      ]);
      expect(component.entriesCount()).toBe(1);
    });

    it('should compute showEntryFields', () => {
      component.currentUnitData.set(null);
      expect(component.showEntryFields()).toBeFalse();

      component.currentUnitData.set(mockValidateResponse);
      expect(component.showEntryFields()).toBeTrue();
    });

    it('should return form controls via f getter', () => {
      expect(component.f).toBe(component.filterForm.controls);
    });
  });

  describe('Format Helpers', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should format date correctly', () => {
      const result = (component as any).formatDate('2024-06-01T00:00:00Z');
      expect(result).toMatch(/01-JUN-2024/i);
    });

    it('should return dash for empty date', () => {
      const result = (component as any).formatDate('');
      expect(result).toBe('-');
    });

    it('should return original value for invalid date', () => {
      const result = (component as any).formatDate('not-a-date');
      expect(result).toBe('not-a-date');
    });

    it('should format datetime correctly', () => {
      const result = (component as any).formatDateTime('2024-06-01T09:15:00Z');
      expect(result).toMatch(/01-JUN-2024/i);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should return dash for empty datetime', () => {
      const result = (component as any).formatDateTime('');
      expect(result).toBe('-');
    });

    it('should return original value for invalid datetime', () => {
      const result = (component as any).formatDateTime('not-a-datetime');
      expect(result).toBe('not-a-datetime');
    });

    it('should format API error with error code', () => {
      const error = { error: { errorCode: '0063', error: 'Unit not found' } };
      const result = (component as any).formatApiError(error, 'Fallback');
      expect(result).toBe('Error 0063: Unit not found');
    });

    it('should format API error with nested errorResponse path', () => {
      const error = { error: { errorResponse: { errorCode: '0064', error: 'Nested error' } } };
      const result = (component as any).formatApiError(error, 'Fallback');
      expect(result).toBe('Error 0064: Nested error');
    });

    it('should format API error without code using body message', () => {
      const error = { error: { message: 'Something went wrong' } };
      const result = (component as any).formatApiError(error, 'Fallback');
      expect(result).toBe('Something went wrong');
    });

    it('should format API error using error.message when no body', () => {
      const error = { message: 'Top-level message' };
      const result = (component as any).formatApiError(error, 'Fallback');
      expect(result).toBe('Top-level message');
    });

    it('should use fallback when no error info available', () => {
      const result = (component as any).formatApiError({}, 'Fallback message');
      expect(result).toBe('Fallback message');
    });

    it('should use fallback when error is null', () => {
      const result = (component as any).formatApiError(null, 'Fallback message');
      expect(result).toBe('Fallback message');
    });
  });

  describe('Lifecycle', () => {
    it('should dismiss snackbar on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      snackbarRef = jasmine.createSpyObj('MatSnackBarRef', ['onAction', 'dismiss']);
      snackbarRef.onAction.and.returnValue(of(void 0));
      (component as any).entrySavedSnackBarRef = snackbarRef;

      component.ngOnDestroy();

      expect(snackbarRef.dismiss).toHaveBeenCalled();
    }));

    it('should complete destroy$ subject on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const spy = jasmine.createSpy('complete');
      (component as any).destroy$.subscribe({ complete: spy });

      component.ngOnDestroy();

      expect(spy).toHaveBeenCalled();
    }));

    it('should not error on destroy when no snackbar ref', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).entrySavedSnackBarRef = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    }));
  });
});
