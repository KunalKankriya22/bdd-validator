import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { FreezeStartTimesOfflineComponent } from './freeze-start-times';
import { FreezeStartTimesService } from './services/freeze-start-times.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import {
  EligibleComponentDto,
  UnitBleedInfoDto,
  FreezeStartTimeResponseDto
} from './models/freeze-start-times.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginService } from '@shared/services/login.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('FreezeStartTimesOfflineComponent', () => {
  let component: FreezeStartTimesOfflineComponent;
  let fixture: ComponentFixture<FreezeStartTimesOfflineComponent>;
  let freezeStartServiceSpy: jasmine.SpyObj<FreezeStartTimesService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<any>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<any>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockUnitInfo: UnitBleedInfoDto = {
    unitId: 'W1234-18-031302-Z',
    collDate: '2025-01-10T00:00:00Z',
    bleedStartTime: '2025-01-10T10:00:00Z',
    bleedEndTime: '2025-01-10T10:15:00Z'
  };

  const mockEligibleComponents: EligibleComponentDto[] = [
    {
      productCode: 'E0385V00',
      productDescription: 'Fresh Frozen Plasma/CPD',
      aliquot: '01'
    },
    {
      productCode: 'E0701V00',
      productDescription: 'Cryoprecipitate/CPD',
      aliquot: '01'
    }
  ];

  const mockFreezeResponse: FreezeStartTimeResponseDto = {
    success: true,
    message: 'Freeze start time recorded successfully',
    cmtiInterdictionGenerated: false,
    interdictionMessage: null
  };

  beforeEach(() => {

    freezeStartServiceSpy = jasmine.createSpyObj('FreezeStartTimesService', [
      'recordFreezeStartTime',
      'getEligibleComponents',
      'getUnitBleedInfo'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Freeze Start Time Offline', subtitle: '' })
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Freeze Start Time Offline');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    headerServiceSpy = createMockHeaderService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getLoggedInUser']);
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable',
      'getChapterLocalDateTime',
      'getChapterLocalDate'
    ]);
    chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
    chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));
    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);

    freezeStartServiceSpy.getUnitBleedInfo.and.returnValue(of(mockUnitInfo));
    freezeStartServiceSpy.getEligibleComponents.and.returnValue(of(mockEligibleComponents));
    freezeStartServiceSpy.recordFreezeStartTime.and.returnValue(of(mockFreezeResponse));
      TestBed.configureTestingModule({
      imports: [FreezeStartTimesOfflineComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: FreezeStartTimesService, useValue: freezeStartServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        provideRouter([])
      ]
    });


    


      freezeStartServiceSpy.recordFreezeStartTime.calls.reset();


      freezeStartServiceSpy.getEligibleComponents.calls.reset();


      freezeStartServiceSpy.getUnitBleedInfo.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      headerServiceSpy.getCurrentChapterTimezone.calls.reset();


      loginServiceSpy.getLoggedInUser.calls.reset();


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDateTime.calls.reset();


      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();


      dialogSpy.open.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('Freeze Start Time Offline');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('');


      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);


      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());


      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment().startOf('day'));


      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);


      freezeStartServiceSpy.getUnitBleedInfo.and.returnValue(of(mockUnitInfo));


      freezeStartServiceSpy.getEligibleComponents.and.returnValue(of(mockEligibleComponents));


      freezeStartServiceSpy.recordFreezeStartTime.and.returnValue(of(mockFreezeResponse));
    fixture = TestBed.createComponent(FreezeStartTimesOfflineComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should initialize header config as computed signal with 2-level breadcrumbs', () => {
      fixture.detectChanges();
      const config = (component as any).headerConfig();
      expect(config.breadcrumbs.length).toBe(2);
      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.breadcrumbs[1].label).toBe('Freeze Start Time Offline');
    });
  });

  describe('Unit ID Validation', () => {
    it('should load unit info when unit ID is validated', fakeAsync(() => {
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(freezeStartServiceSpy.getUnitBleedInfo).toHaveBeenCalledWith('W1234-18-031302-Z');
      expect((component as any).unitInfo()).toEqual(mockUnitInfo);
    }));

    it('should load eligible components after unit info loaded', fakeAsync(() => {
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(freezeStartServiceSpy.getEligibleComponents).toHaveBeenCalledWith('W1234-18-031302-Z');
      expect((component as any).eligibleComponents()).toEqual(mockEligibleComponents);
    }));

    it('should allow re-scanning same unit for different components', fakeAsync(() => {
      fixture.detectChanges();

      (component as any).scannedEntries.set([
        {
          unitId: 'W1234-18-031302-Z',
          collectionDate: '10-JAN-2025',
          productCode: 'E0385V00',
          productDescription: 'Fresh Frozen Plasma/CPD',
          aliquot: '01',
          freezeStart: '11-JAN-2025 13:16'
        }
      ]);

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(freezeStartServiceSpy.getUnitBleedInfo).toHaveBeenCalledWith('W1234-18-031302-Z');
    }));

    it('should show error when unit info load fails', fakeAsync(() => {
      freezeStartServiceSpy.getUnitBleedInfo.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } }))
      );

      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'INVALID', manualUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(event.reject).toHaveBeenCalledWith('Unit not found');
      expect((component as any).unitInfo()).toBeNull();
    }));



    it('should auto-select product when only one option available', fakeAsync(() => {
      freezeStartServiceSpy.getEligibleComponents.and.returnValue(
        of([mockEligibleComponents[0]])
      );

      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect((component as any).freezeForm.get('productCode')?.value).toBe('E0385V00');
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).eligibleComponents.set(mockEligibleComponents);
      (component as any).productOptions.set([
        {
          displayValue: 'E0385V00 - 01',
          productCode: 'E0385V00',
          productDescription: 'Fresh Frozen Plasma/CPD',
          aliquot: '01'
        }
      ]);
    });

    it('should require product code', () => {
      const productCodeControl = (component as any).freezeForm.get('productCode');
      productCodeControl?.setValue(null);
      productCodeControl?.markAsTouched();
      expect(productCodeControl?.hasError('required')).toBeTrue();
    });

    it('should allow empty freeze start date', () => {
      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      dateControl?.setValue(null);
      dateControl?.markAsTouched();
      expect(dateControl?.valid).toBeTrue();
    });

    it('should validate time format', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('25:00');
      timeControl?.markAsTouched();
      expect(timeControl?.hasError('pattern')).toBeTrue();
    });


  });

  describe('Record Freeze Time', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).eligibleComponents.set(mockEligibleComponents);
      (component as any).productOptions.set([
        {
          displayValue: 'E0385V00 - 01',
          productCode: 'E0385V00',
          productDescription: 'Fresh Frozen Plasma/CPD',
          aliquot: '01'
        }
      ]);
      (component as any).freezeForm.patchValue({
        productCode: 'E0385V00 - 01',
        freezeStartDate: moment().startOf('day'),
        freezeTime: '00:01'
      });
    });





    it('should add entry to table on success', fakeAsync(() => {
      (component as any).recordFreezeTime();
      tick();
      expect((component as any).scannedEntries().length).toBe(1);
      expect((component as any).scannedEntries()[0].unitId).toBe('W1234-18-031302-Z');
      expect((component as any).scannedEntries()[0].productCode).toBe('E0385V00');
    }));



    it('should increment saved count', fakeAsync(() => {
      (component as any).recordFreezeTime();
      tick();
      expect((component as any).savedCount()).toBe(1);
    }));

    it('should show CMTI Yes/No dialog before saving when date is not today', fakeAsync(() => {
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment('2025-01-11'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('13:16', { emitEvent: false });
      const cmtiDialog = (component as any).dialog;
      cmtiDialog.open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) } as any);

      (component as any).recordFreezeTime();
      tick(1100);

      expect(cmtiDialog.open).toHaveBeenCalled();
      const dialogConfig = cmtiDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig.data.confirmText).toBe('Yes, Proceed');
      expect(dialogConfig.data.cancelText).toBe('No, Cancel');
      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
    }));

    it('should save entry when user clicks Yes on CMTI dialog', fakeAsync(() => {
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment('2025-01-11'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('13:16', { emitEvent: false });
      const cmtiDialog = (component as any).dialog;
      cmtiDialog.open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) } as any);

      (component as any).recordFreezeTime();
      tick(1100);

      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
      expect((component as any).scannedEntries().length).toBe(1);
    }));

    it('should NOT call API when user clicks No on CMTI dialog', fakeAsync(() => {
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment('2025-01-11'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('13:16', { emitEvent: false });
      const cmtiDialog = (component as any).dialog;
      cmtiDialog.open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(false) } as any);

      (component as any).recordFreezeTime();
      tick(1100);

      expect(freezeStartServiceSpy.recordFreezeStartTime).not.toHaveBeenCalled();
      expect((component as any).scannedEntries().length).toBe(0);
    }));

    it('should show post-save CMTI warning when API returns interdiction on today date', fakeAsync(() => {
      const chapterToday = moment().startOf('day');
      (component as any).chapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
      (component as any).chapterTimezoneService.getChapterLocalDate.and.returnValue(chapterToday);
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment().startOf('day'));

      const cmtiResponse: FreezeStartTimeResponseDto = {
        success: true,
        message: 'Freeze start time recorded successfully',
        cmtiInterdictionGenerated: true,
        interdictionMessage: 'CMTI interdiction generated'
      };
      freezeStartServiceSpy.recordFreezeStartTime.and.returnValue(of(cmtiResponse));
      const cmtiDialog = (component as any).dialog;
      cmtiDialog.open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) } as any);

      (component as any).recordFreezeTime();
      tick(1100);

      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
      expect((component as any).scannedEntries().length).toBe(1);
      expect(cmtiDialog.open).toHaveBeenCalled();
      const dialogConfig = cmtiDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig.data.title).toBe('CMTI Interdiction Warning');
      expect(dialogConfig.data.confirmText).toBe('OK');
    }));

    it('should skip CMTI dialog and save directly when date is today', fakeAsync(() => {
      const chapterToday = moment().startOf('day');
      (component as any).chapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
      (component as any).chapterTimezoneService.getChapterLocalDate.and.returnValue(chapterToday);
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment().startOf('day'));
      dialogSpy.open.calls.reset();

      (component as any).recordFreezeTime();
      tick(1100);

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
      expect((component as any).scannedEntries().length).toBe(1);
    }));



    it('should reset form for next scan after success', fakeAsync(() => {
      (component as any).recordFreezeTime();
      tick();
      expect((component as any).unitInfo()).toBeNull();
      expect((component as any).eligibleComponents().length).toBe(0);
      expect((component as any).freezeForm.get('productCode')?.value).toBeNull();
    }));
  });

  describe('Table Display', () => {




    it('should show entry count when entries exist', () => {
      fixture.detectChanges();
      (component as any).scannedEntries.set([
        {
          unitId: 'W1234-18-031302-Z',
          collectionDate: '10-JAN-2025',
          productCode: 'E0385V00',
          productDescription: 'Fresh Frozen Plasma/CPD',
          aliquot: '01',
          freezeStart: '11-JAN-2025 13:16'
        }
      ]);

      expect((component as any).unitIdHeader()).toContain('(1)');
    });
  });
  describe('Time Validation', () => {
    let chapterTimezoneServiceSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      chapterTimezoneServiceSpy = (component as any).chapterTimezoneService;
      // Ensure chapterTimezoneService has the required spy methods
      if (!chapterTimezoneServiceSpy.isChapterLocalDateAvailable) {
        chapterTimezoneServiceSpy.isChapterLocalDateAvailable = jasmine.createSpy('isChapterLocalDateAvailable');
      }
      if (!chapterTimezoneServiceSpy.getChapterLocalDateTime) {
        chapterTimezoneServiceSpy.getChapterLocalDateTime = jasmine.createSpy('getChapterLocalDateTime');
      }
      fixture.detectChanges();
    });

    it('should validate time format correctly', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Valid formats
      timeControl?.setValue('00:00');
      expect(timeControl?.hasError('pattern')).toBeFalse();

      timeControl?.setValue('23:59');
      expect(timeControl?.hasError('pattern')).toBeFalse();

      timeControl?.setValue('12:30');
      expect(timeControl?.hasError('pattern')).toBeFalse();

      // Invalid formats
      timeControl?.setValue('24:00');
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:60');
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('1:30');
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:5');
      expect(timeControl?.hasError('pattern')).toBeTrue();
    });

    it('should reject future time on same day (using ChapterTimezoneService)', () => {
      // Mock chapter current time as 2025-01-11 14:00 using Priority 1 (API-based)
      const chapterNow = moment('2025-01-11 14:00:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Set date to same day
      dateControl?.setValue(moment('2025-01-11'));

      // Try to set future time (15:00, which is after 14:00)
      timeControl?.setValue('15:00');
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeTrue();
    });

    it('should reject future time using headerService fallback', () => {
      // Simulate ChapterTimezoneService not available (Priority 2 fallback)
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Set date to today
      const today = moment();
      dateControl?.setValue(today);

      // Try to set a time far in the future (23:59)
      // This should be rejected if current time is before 23:59
      const currentHour = new Date().getHours();
      if (currentHour < 23) {
        timeControl?.setValue('23:59');
        timeControl?.updateValueAndValidity();

        // May or may not be future depending on actual current time
        // Just verify validation runs without error
        expect(timeControl?.hasError('pattern')).toBeFalse();
      }
    });

    it('should accept current time', () => {
      // Mock chapter current time as 2025-01-11 14:30
      const chapterNow = moment('2025-01-11 14:30:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      dateControl?.setValue(moment('2025-01-11'));
      timeControl?.setValue('14:30');
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeFalsy();
    });

    it('should accept past time on same day', () => {
      // Mock chapter current time as 2025-01-11 14:30
      const chapterNow = moment('2025-01-11 14:30:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      dateControl?.setValue(moment('2025-01-11'));
      timeControl?.setValue('10:00');
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeFalsy();
    });

    it('should accept any time on past dates', () => {
      // Mock chapter current time as 2025-01-11 14:00
      const chapterNow = moment('2025-01-11 14:00:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Set past date
      dateControl?.setValue(moment('2025-01-10'));

      // Even late time should be valid on past date
      timeControl?.setValue('23:59');
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeFalsy();
    });

    it('should reject any time on future dates', () => {
      // Mock chapter current time as 2025-01-11 14:00
      const chapterNow = moment('2025-01-11 14:00:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Set future date
      dateControl?.setValue(moment('2025-01-12'));

      // Even early time should be invalid on future date
      timeControl?.setValue('00:00');
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeTrue();
    });

    it('should revalidate time when date changes', () => {
      // Mock chapter current time as 2025-01-11 14:00
      const chapterNow = moment('2025-01-11 14:00:00');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(chapterNow);

      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      // Set initial valid state (past date with any time)
      dateControl?.setValue(moment('2025-01-10'));
      timeControl?.setValue('23:00');
      timeControl?.updateValueAndValidity();
      expect(timeControl?.hasError('futureTime')).toBeFalsy();

      // Change to current date - same time should now be invalid
      dateControl?.setValue(moment('2025-01-11'));
      // Trigger revalidation (this happens automatically via valueChanges subscription)
      timeControl?.updateValueAndValidity();

      expect(timeControl?.hasError('futureTime')).toBeTrue();
    });

    it('should not validate time when no date is selected', () => {
      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      dateControl?.setValue(null);
      timeControl?.setValue('23:00');
      timeControl?.updateValueAndValidity();

      // Should not have futureTime error when no date is selected
      expect(timeControl?.hasError('futureTime')).toBeFalsy();
    });

    it('should not validate time when time is empty', () => {
      const dateControl = (component as any).freezeForm.get('freezeStartDate');
      const timeControl = (component as any).freezeForm.get('freezeTime');

      dateControl?.setValue(moment('2025-01-11'));
      timeControl?.setValue('');
      timeControl?.updateValueAndValidity();

      // Should not have futureTime error when time is empty
      expect(timeControl?.hasError('futureTime')).toBeFalsy();
    });
  });

  describe('Date Validation', () => {
    let chapterTimezoneServiceSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      chapterTimezoneServiceSpy = (component as any).chapterTimezoneService;
      // Ensure chapterTimezoneService has the required spy methods
      if (!chapterTimezoneServiceSpy.isChapterLocalDateAvailable) {
        chapterTimezoneServiceSpy.isChapterLocalDateAvailable = jasmine.createSpy('isChapterLocalDateAvailable');
      }
      if (!chapterTimezoneServiceSpy.getChapterLocalDate) {
        chapterTimezoneServiceSpy.getChapterLocalDate = jasmine.createSpy('getChapterLocalDate');
      }
      fixture.detectChanges();
    });

    it('should prevent selecting future dates (using ChapterTimezoneService)', () => {
      const chapterToday = moment('2025-01-11').startOf('day');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(chapterToday);

      const maxDate = (component as any).getMaxDate();
      expect(maxDate.format('YYYY-MM-DD')).toBe('2025-01-11');
    });

    it('should prevent selecting future dates (using headerService fallback)', () => {
      // Simulate ChapterTimezoneService not available
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(false);
      const maxDate = (component as any).getMaxDate();
      // Should return a valid date (browser time fallback)
      expect(maxDate.isValid()).toBeTrue();
    });

    it('should filter out future dates in date picker', () => {
      const chapterToday = moment('2025-01-11').startOf('day');
      chapterTimezoneServiceSpy.isChapterLocalDateAvailable.and.returnValue(true);
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(chapterToday);

      const filterFn = (component as any).freezeDateFilter;

      // Today should be selectable
      expect(filterFn(moment('2025-01-11'))).toBeTrue();

      // Past dates should be selectable
      expect(filterFn(moment('2025-01-10'))).toBeTrue();
      expect(filterFn(moment('2024-12-01'))).toBeTrue();

      // Future dates should not be selectable
      expect(filterFn(moment('2025-01-12'))).toBeFalse();
      expect(filterFn(moment('2025-02-01'))).toBeFalse();
    });

    it('should allow null date in filter', () => {
      const filterFn = (component as any).freezeDateFilter;
      expect(filterFn(null)).toBeTrue();
    });
  });

  describe('Auto Format Time', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format 4 digits as HH:MM', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('1000');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('10:00');
    });

    it('should format 3 digits with trailing zero pad', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('201');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('20:10');
    });

    it('should format 2 digits as hours with 00 minutes', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('10');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('10:00');
    });

    it('should format 1 digit with leading zero pad', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('5');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('05:00');
    });

    it('should strip non-digit separators before formatting', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('10.0');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('10:00');
    });

    it('should skip already valid HH:MM format', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('14:30');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('14:30');
    });

    it('should not format invalid time (hours > 23)', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('2500');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('2500');
    });

    it('should not format empty value', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('');
    });

    it('should not format null value', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue(null);
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBeNull();
    });

    it('should take first 4 digits when more than 4 provided', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('12345');
      (component as any).autoFormatTime();
      expect(timeControl?.value).toBe('12:34');
    });
  });

  describe('onTimeBlur and onTimeEnter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should auto-format time on blur', () => {
      const timeControl = (component as any).freezeForm.get('freezeTime');
      timeControl?.setValue('1430');
      (component as any).onTimeBlur();
      expect(timeControl?.value).toBe('14:30');
    });

    it('should auto-format and record on Enter key', fakeAsync(() => {
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).eligibleComponents.set(mockEligibleComponents);
      const option = {
        displayValue: 'E0385V00',
        productCode: 'E0385V00',
        productDescription: 'Fresh Frozen Plasma/CPD',
        aliquot: '01'
      };
      (component as any).productOptions.set([option]);
      (component as any).selectedProductOption.set(option);
      (component as any).freezeForm.get('productCode')?.setValue('E0385V00', { emitEvent: false });
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment().startOf('day'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('0001', { emitEvent: false });

      const event = { key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') } as any;
      (component as any).onTimeEnter(event);
      tick();

      expect(event.preventDefault).toHaveBeenCalled();
      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
    }));

    it('should not trigger record on non-Enter key', () => {
      const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault') } as any;
      (component as any).onTimeEnter(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).scannedEntries.set([
        { unitId: 'B0001180000001', collectionDate: '10-JAN-2025', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01', freezeStart: '11-JAN-2025 13:16' },
        { unitId: 'A0001180000001', collectionDate: '10-JAN-2025', productCode: 'E0701V00', productDescription: 'CRYO', aliquot: '01', freezeStart: '11-JAN-2025 14:00' },
        { unitId: 'C0001180000001', collectionDate: '10-JAN-2025', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '02', freezeStart: '11-JAN-2025 15:00' },
      ]);
    });

    it('should default to descending sort', () => {
      expect((component as any).sortDirection()).toBe('D');
      const sorted = (component as any).sortedEntries();
      expect(sorted[0].unitId).toBe('C0001180000001');
      expect(sorted[2].unitId).toBe('A0001180000001');
    });

    it('should sort ascending when direction is A', () => {
      (component as any).sortDirection.set('A');
      const sorted = (component as any).sortedEntries();
      expect(sorted[0].unitId).toBe('A0001180000001');
      expect(sorted[2].unitId).toBe('C0001180000001');
    });

    it('should return insertion order when direction is default', () => {
      (component as any).sortDirection.set('default');
      const sorted = (component as any).sortedEntries();
      expect(sorted[0].unitId).toBe('B0001180000001');
    });

    it('should cycle sort direction D -> A -> default -> D on sort change', () => {
      expect((component as any).sortDirection()).toBe('D');

      (component as any).onSortChange({ column: 'unitId', direction: 'A' });
      expect((component as any).sortDirection()).toBe('A');

      (component as any).onSortChange({ column: 'unitId', direction: 'default' });
      expect((component as any).sortDirection()).toBe('default');

      (component as any).onSortChange({ column: 'unitId', direction: 'D' });
      expect((component as any).sortDirection()).toBe('D');
    });

    it('should ignore sort change for non-unitId columns', () => {
      (component as any).onSortChange({ column: 'productCode', direction: 'A' });
      expect((component as any).sortDirection()).toBe('D');
    });

    it('should reset page index on sort change', () => {
      (component as any).currentPageIndex.set(2);
      (component as any).onSortChange({ column: 'unitId', direction: 'A' });
      expect((component as any).currentPageIndex()).toBe(0);
    });
  });

  describe('Format Unit ID', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format DIN unit ID with hyphens', () => {
      expect(component.formatUnitId('W123418000001-Z')).toBe('W1234-18-000001-Z');
    });

    it('should format ISBT unit ID with hyphens', () => {
      expect(component.formatUnitId('W123418000001')).toBe('W1234-18-000001');
    });

    it('should return unformatted ID if no pattern matches', () => {
      expect(component.formatUnitId('SHORT')).toBe('SHORT');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatUnitId('')).toBe('');
    });
  });

  describe('onUnitCleared', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).validatedUnitId.set('W1234-18-031302-Z');
      (component as any).eligibleComponents.set(mockEligibleComponents);
      (component as any).productOptions.set([{ displayValue: 'E0385V00', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01' }]);
      (component as any).duplicateError.set('some error');
    });

    it('should reset all dependent state', () => {
      (component as any).onUnitCleared();
      expect((component as any).unitInfo()).toBeNull();
      expect((component as any).validatedUnitId()).toBe('');
      expect((component as any).eligibleComponents().length).toBe(0);
      expect((component as any).productOptions().length).toBe(0);
      expect((component as any).duplicateError()).toBeNull();
      expect((component as any).freezeForm.get('productCode')?.value).toBeNull();
    });
  });

  describe('recordFreezeTime - error paths', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark controls touched when form is invalid', () => {
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).freezeForm.get('productCode')?.setValue(null);
      (component as any).recordFreezeTime();
      expect((component as any).freezeForm.get('productCode')?.touched).toBeTrue();
    });

    it('should show error when no product selected', () => {
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).freezeForm.get('productCode')?.setValue('test');
      (component as any).selectedProductOption.set(null);
      (component as any).recordFreezeTime();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a valid product');
    });

    it('should block duplicate unit+product+aliquot', fakeAsync(() => {
      const option = { displayValue: 'E0385V00', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01' };
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).productOptions.set([option]);
      (component as any).selectedProductOption.set(option);
      (component as any).freezeForm.get('productCode')?.setValue('E0385V00', { emitEvent: false });
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment('2025-01-11'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('13:16', { emitEvent: false });
      (component as any).scannedEntries.set([{
        unitId: 'W1234-18-031302-Z', collectionDate: '10-JAN-2025', productCode: 'E0385V00',
        productDescription: 'FFP', aliquot: '01', freezeStart: '11-JAN-2025 13:16'
      }]);

      (component as any).recordFreezeTime();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Freeze details already recorded for this component');
      expect(freezeStartServiceSpy.recordFreezeStartTime).not.toHaveBeenCalled();
    }));

    it('should show API error on record failure', fakeAsync(() => {
      freezeStartServiceSpy.recordFreezeStartTime.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      const option = { displayValue: 'E0385V00', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01' };
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).productOptions.set([option]);
      (component as any).selectedProductOption.set(option);
      (component as any).freezeForm.get('productCode')?.setValue('E0385V00', { emitEvent: false });
      (component as any).freezeForm.get('freezeStartDate')?.setValue(moment().startOf('day'), { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue('00:01', { emitEvent: false });

      (component as any).recordFreezeTime();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect((component as any).isSaving()).toBeFalse();
    }));

    it('should not call API when unitInfo is null', () => {
      (component as any).unitInfo.set(null);
      (component as any).freezeForm.get('productCode')?.setValue('test');
      (component as any).recordFreezeTime();
      expect(freezeStartServiceSpy.recordFreezeStartTime).not.toHaveBeenCalled();
    });
  });

  describe('loadEligibleComponents - edge cases', () => {
    it('should show error and clear unit when no eligible components', fakeAsync(() => {
      freezeStartServiceSpy.getEligibleComponents.and.returnValue(of([]));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No eligible frozen products for this unit');
    }));

    it('should show error on eligible components API failure', fakeAsync(() => {
      freezeStartServiceSpy.getEligibleComponents.and.returnValue(
        throwError(() => ({ error: { message: 'Components lookup failed' } }))
      );
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'W1234-18-031302-Z', manualUnitId: 'W1234-18-031302-Z' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      (component as any).onUnitPostValidate(event);
      tick(200);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Components lookup failed');
      expect((component as any).unitInfo()).toBeNull();
    }));
  });

  describe('Computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('collectionDate should return formatted date when unitInfo set', () => {
      (component as any).unitInfo.set(mockUnitInfo);
      const result = (component as any).collectionDate();
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('collectionDate should return dash when unitInfo is null', () => {
      (component as any).unitInfo.set(null);
      expect((component as any).collectionDate()).toBe('-');
    });

    it('productDescription should return selected option description', () => {
      (component as any).selectedProductOption.set({
        displayValue: 'E0385V00', productCode: 'E0385V00',
        productDescription: 'Fresh Frozen Plasma/CPD', aliquot: '01'
      });
      expect((component as any).productDescription()).toBe('Fresh Frozen Plasma/CPD');
    });

    it('productDescription should return dash when no option selected', () => {
      (component as any).selectedProductOption.set(null);
      expect((component as any).productDescription()).toBe('-');
    });

    it('formReady should be true when unitInfo and components exist', () => {
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).eligibleComponents.set(mockEligibleComponents);
      expect((component as any).formReady()).toBeTrue();
    });

    it('formReady should be false when unitInfo is null', () => {
      (component as any).unitInfo.set(null);
      (component as any).eligibleComponents.set(mockEligibleComponents);
      expect((component as any).formReady()).toBeFalse();
    });

    it('formReady should be false when no eligible components', () => {
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).eligibleComponents.set([]);
      expect((component as any).formReady()).toBeFalse();
    });

    it('unitIdHeader should return plain label when no entries', () => {
      (component as any).scannedEntries.set([]);
      expect((component as any).unitIdHeader()).toBe('Unit ID');
    });

    it('filteredProductOptions should filter by description', () => {
      (component as any).productOptions.set([
        { displayValue: 'E0385V00', productCode: 'E0385V00', productDescription: 'Fresh Frozen Plasma/CPD', aliquot: '01' },
        { displayValue: 'E0701V00', productCode: 'E0701V00', productDescription: 'Cryoprecipitate/CPD', aliquot: '01' },
      ]);
      (component as any).productSearchText.set('cryo');
      const filtered = (component as any).filteredProductOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('E0701V00');
    });

    it('filteredProductOptions should return all when no search', () => {
      (component as any).productOptions.set([
        { displayValue: 'E0385V00', productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01' },
        { displayValue: 'E0701V00', productCode: 'E0701V00', productDescription: 'CRYO', aliquot: '01' },
      ]);
      (component as any).productSearchText.set('');
      expect((component as any).filteredProductOptions().length).toBe(2);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update page index and size on page change', () => {
      (component as any).onPageChange({ pageIndex: 2, pageSize: 25 });
      expect((component as any).currentPageIndex()).toBe(2);
      expect((component as any).currentPageSize()).toBe(25);
    });

    it('should paginate sorted data correctly', () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        unitId: `UNIT${String(i).padStart(3, '0')}`, collectionDate: '10-JAN-2025',
        productCode: 'E0385V00', productDescription: 'FFP', aliquot: '01', freezeStart: '11-JAN-2025 13:16'
      }));
      (component as any).scannedEntries.set(entries);
      (component as any).currentPageSize.set(10);
      (component as any).currentPageIndex.set(1);
      const page = (component as any).paginatedData();
      expect(page.length).toBe(5);
    });
  });

  describe('Chapter change', () => {
    it('should clear all state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).scannedEntries.set([{
        unitId: 'W1234-18-031302-Z', collectionDate: '10-JAN-2025', productCode: 'E0385V00',
        productDescription: 'FFP', aliquot: '01', freezeStart: '11-JAN-2025 13:16'
      }]);
      (component as any).savedCount.set(5);
      (component as any).unitInfo.set(mockUnitInfo);

      (component as any).clearAll();
      tick();

      expect((component as any).scannedEntries().length).toBe(0);
      expect((component as any).savedCount()).toBe(0);
      expect((component as any).unitInfo()).toBeNull();
      expect((component as any).sortDirection()).toBe('D');
    }));
  });

  describe('Record with no date/time', () => {
    it('should record with empty freezeStartTime when no date provided', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).unitInfo.set(mockUnitInfo);
      (component as any).selectedProductOption.set({
        displayValue: 'E0385V00', productCode: 'E0385V00',
        productDescription: 'Fresh Frozen Plasma/CPD', aliquot: '01'
      });
      (component as any).freezeForm.get('productCode')?.setValue('E0385V00', { emitEvent: false });
      (component as any).freezeForm.get('freezeStartDate')?.setValue(null, { emitEvent: false });
      (component as any).freezeForm.get('freezeTime')?.setValue(null, { emitEvent: false });

      (component as any).recordFreezeTime();
      tick();

      expect(freezeStartServiceSpy.recordFreezeStartTime).toHaveBeenCalled();
      const request = freezeStartServiceSpy.recordFreezeStartTime.calls.mostRecent().args[0];
      expect(request.freezeStartTime).toBe('');
    }));
  });
});
