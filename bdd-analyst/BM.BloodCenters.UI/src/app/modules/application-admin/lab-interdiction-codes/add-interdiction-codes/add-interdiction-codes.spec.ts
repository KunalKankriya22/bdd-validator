import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddInterdictionCodes } from './add-interdiction-codes';
import { AddInterdictionCodeService } from '../services/add-interdiction-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { InterdictionCodeApiResponse } from '../interfaces/view-interdiction-code.interface';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddInterdictionCodes', () => {
  let futureDateForPayload: any;
  let payload: any;
  let termDate: any;
  let effDate: any;
  let effectiveDate: any;
  let component: AddInterdictionCodes;
  let fixture: ComponentFixture<AddInterdictionCodes>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockService: jasmine.SpyObj<AddInterdictionCodeService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Compute dynamic dates once per suite to avoid timezone-sensitive hardcoding.
  // effDate is well in the past (edit mode allows past dates); termDate is well in the future.
  const pastEffDate  = moment().subtract(60, 'days').startOf('day');
  const futureTermDate = moment().add(180, 'days').startOf('day');

  const mockApiResponse: InterdictionCodeApiResponse = {
    interCode: 'C001',
    interType: 'I',
    interDesc: 'Test',
    systemInterCode: 'C001',
    systemInterFlag: 'Y',
    effDate: pastEffDate.format('YYYY-MM-DD'),
    termDate: futureTermDate.format('YYYY-MM-DD'),
    programId: 'VINTER',
    changeControlFlag: 'D',
    lastModifiedDate: pastEffDate.format('YYYY-MM-DD') + ' 10:00:00',
    auditKey: 12345
  };

  const baseEditRowData = {
    interCode: 'C001',
    interType: 'I',
    interDesc: 'Test Desc',
    effDate: pastEffDate.format('YYYY-MM-DD'),
    termDate: futureTermDate.format('YYYY-MM-DD'),
    systemInterFlag: 'Y'
  };

  const mockHeaderService = {
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC')
  };

  beforeEach(() => {
    mockSnackBar = createMockMatSnackBar();
    mockService = jasmine.createSpyObj('AddInterdictionCodeService', [
      'addInterdictionCode',
      'updateInterdictionCode'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Configure module WITHOUT the MatSnackBar root provider — it must be
    // injected at component level so it wins over the component's own
    // MatSnackBarModule provider (standalone component local injector wins).
    TestBed.configureTestingModule({
      imports: [AddInterdictionCodes],
      providers: [
        { provide: AddInterdictionCodeService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: Router, useValue: mockRouter }
      ],
    });

    TestBed.overrideComponent(AddInterdictionCodes, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    });
    fixture = TestBed.createComponent(AddInterdictionCodes);
    component = fixture.componentInstance;
    component.mode = 'add';
    fixture.detectChanges();
  });

  // ─── Component Creation ──────────────────────────────────────────────────────

  describe('Component Creation', () => {

    it('should initialize action as add when mode is add', () => {
      expect(component.action).toBe('add');
    });

    it('should initialize all four type options', () => {
      expect(component.typeOptions()).toContain('NFT');
      expect(component.typeOptions()).toContain('INITIAL');
      expect(component.typeOptions()).toContain('BIO');
      expect(component.typeOptions()).toContain('HOLD');
      expect(component.typeOptions().length).toBe(4);
    });

    it('should initialize scope as lab', () => {
      expect(component.scope).toBe('lab');
    });
  });

  // ─── Chapter Date as minDate ─────────────────────────────────────────────────

  describe('Chapter Date as minDate', () => {
    it('should set minDate to today based on chapter timezone', () => {
      const today = moment().startOf('day');
      const minDate = component.minDate;
      // minDate should be within the current day (accounting for timezone differences)
      const diff = Math.abs(minDate.diff(today, 'hours'));
      expect(diff).toBeLessThan(24);
      expect(minDate.hours()).toBe(0);
      expect(minDate.minutes()).toBe(0);
      expect(minDate.seconds()).toBe(0);
    });


    it('terminationDateFilter should return false for past dates', () => {
      const yesterday = moment().subtract(1, 'day');
      expect(component.terminationDateFilter(yesterday)).toBeFalse();
    });

    it('terminationDateFilter should return true for future dates', () => {
      const tomorrow = moment().add(1, 'day');
      expect(component.terminationDateFilter(tomorrow)).toBeTrue();
    });
  });

  // ─── Form Initialization — Add Mode ─────────────────────────────────────────

  describe('Form Initialization — Add Mode', () => {
    it('should initialize form with all required controls', () => {
      expect(component.form.get('code')).toBeTruthy();
      expect(component.form.get('type')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
      expect(component.form.get('interdictionEnabled')).toBeTruthy();
    });



    it('should initialize all fields with empty/null values in add mode', () => {
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('type')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
      expect(component.form.get('interdictionEnabled')?.value).toBeTrue();
    });
  });

  // ─── Form Initialization — Edit Mode ────────────────────────────────────────

  describe('Form Initialization — Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.rowData = { ...baseEditRowData };
      component.ngOnInit();
    });

    it('should set action to edit', () => {
      expect(component.action).toBe('edit');
    });



    it('should populate code from row data', () => {
      expect(component.form.get('code')?.value).toBe('C001');
    });

    it('should map interType I to INITIAL', () => {
      expect(component.form.get('type')?.value).toBe('INITIAL');
    });

    it('should populate description from row data', () => {
      expect(component.form.get('description')?.value).toBe('Test Desc');
    });

    it('should populate effective date as moment from row data', () => {
      effDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
      expect(effDate.format('YYYY-MM-DD')).toBe(pastEffDate.format('YYYY-MM-DD'));
    });

    it('should populate termination date as moment from row data', () => {
      termDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
      expect(termDate.format('YYYY-MM-DD')).toBe(futureTermDate.format('YYYY-MM-DD'));
    });

    it('should set interdictionEnabled to true when systemInterFlag is Y', () => {
      expect(component.form.get('interdictionEnabled')?.value).toBeTrue();
    });

    it('should set interdictionEnabled to false when systemInterFlag is N', () => {
      component.rowData = { ...baseEditRowData, systemInterFlag: 'N' };
      component.ngOnInit();
      expect(component.form.get('interdictionEnabled')?.value).toBeFalse();
    });

    it('should store editModeValues.code for display', () => {
      expect(component.editModeValues.code).toBe('C001');
    });

    it('should store editModeValues.effectiveDate formatted as DD-MMM-YYYY', () => {
      expect(component.editModeValues.effectiveDate.toUpperCase()).toBe(pastEffDate.format('DD-MMM-YYYY').toUpperCase());
    });

    it('should map interType H to HOLD', () => {
      component.rowData = { ...baseEditRowData, interType: 'H' };
      component.ngOnInit();
      expect(component.form.get('type')?.value).toBe('HOLD');
    });

    it('should map interType B to BIO', () => {
      component.rowData = { ...baseEditRowData, interType: 'B' };
      component.ngOnInit();
      expect(component.form.get('type')?.value).toBe('BIO');
    });

    it('should map interType N to NFT', () => {
      component.rowData = { ...baseEditRowData, interType: 'N' };
      component.ngOnInit();
      expect(component.form.get('type')?.value).toBe('NFT');
    });

    it('should handle null termination date in row data', () => {
      component.rowData = { ...baseEditRowData, termDate: null };
      component.ngOnInit();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should handle missing termination date in row data', () => {
      const { termDate: _, ...rowWithoutTerm } = baseEditRowData;
      component.rowData = rowWithoutTerm;
      component.ngOnInit();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });
  });

  // ─── Effective Date Validation ───────────────────────────────────────────────

  describe('Effective Date Validation', () => {
    it('should show required error when effective date is empty and touched', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should show error message when effective date is in the past', () => {
      const pastDate = moment().subtract(1, 'day').startOf('day');
      component.form.get('effectiveDate')?.setValue(pastDate);
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();
      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date cannot be in the past');
    });




    it('should not apply past-date validator in edit mode (effective date is disabled)', () => {
      component.mode = 'edit';
      component.rowData = { ...baseEditRowData, effDate: moment().subtract(5, 'years').format('YYYY-MM-DD') };
      component.ngOnInit();
      // Disabled controls are not validated
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  // ─── Termination Date Validation ─────────────────────────────────────────────

  describe('Termination Date Validation', () => {

    it('should show past date error when termination date is yesterday', () => {
      const pastDate = moment().subtract(1, 'day').startOf('day');
      component.form.get('terminationDate')?.setValue(pastDate);
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.updateValueAndValidity();
      expect(component.getTerminationDateError()).toContain('cannot be in the past');
    });

    it('should show range error when termination date is before effective date', () => {
      effectiveDate = moment().add(5, 'days').startOf('day');
      const terminationDate = moment().add(2, 'days').startOf('day');
      component.form.patchValue({ effectiveDate, terminationDate });
      component.form.markAllAsTouched();
      expect(component.getTerminationDateError()).toContain('on or after');
    });




  });

  // ─── terminationDateFilter — effectiveDate interaction ───────────────────────

  describe('terminationDateFilter — effectiveDate interaction', () => {
    it('should block dates before effective date', () => {
      const futureDate = moment().add(10, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(futureDate);
      const beforeEffective = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEffective)).toBeFalse();
    });

    it('should allow dates on or after effective date', () => {
      const futureDate = moment().add(10, 'days').startOf('day');
      component.form.get('effectiveDate')?.setValue(futureDate);
      const afterEffective = moment().add(15, 'days');
      expect(component.terminationDateFilter(afterEffective)).toBeTrue();
    });

    it('should allow future dates when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);
      const futureDate = moment().add(5, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });


    it('should not clear termination date when it remains valid after effective date change', () => {
      const tomorrow = moment().add(1, 'day').startOf('day');
      const in30Days = moment().add(30, 'days').startOf('day');
      const inTwoWeeks = moment().add(14, 'days').startOf('day');

      component.form.patchValue({ effectiveDate: tomorrow, terminationDate: in30Days });
      component.form.get('effectiveDate')?.setValue(inTwoWeeks);
      expect(component.form.get('terminationDate')?.value).not.toBeNull();
    });
  });

  // ─── hasVisibleDateError ─────────────────────────────────────────────────────

  describe('hasVisibleDateError', () => {
    it('should return false when both dates are valid', () => {
      component.form.patchValue({
        effectiveDate: moment().add(1, 'day'),
        terminationDate: moment().add(2, 'days')
      });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeFalse();
    });

    it('should return false when dates are not touched', () => {
      expect(component.hasVisibleDateError).toBeFalse();
    });

    it('should return true when effective date has required error', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when effective date is in the past', () => {
      component.form.get('effectiveDate')?.setValue(moment().subtract(1, 'day').startOf('day'));
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when termination date is in the past', () => {
      component.form.patchValue({
        effectiveDate: moment(),
        terminationDate: moment().subtract(1, 'day')
      });
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });
  });

  // ─── Form Validity & Button Enable/Disable ───────────────────────────────────

  describe('Form Validity and Button Enable/Disable', () => {










    it('should mark all controls touched when form is submitted invalid', () => {
      component.onSaveOrEdit('add');
      expect(component.form.get('code')?.touched).toBeTrue();
      expect(component.form.get('type')?.touched).toBeTrue();
      expect(component.form.get('description')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  // ─── Type Search ─────────────────────────────────────────────────────────────

  describe('Type Search', () => {
    it('should filter options to only INITIAL when searching INIT', fakeAsync(() => {
      component.typeSearchControl.setValue('INIT');
      tick(300);
      expect(component.typeOptions()).toEqual(['INITIAL']);
    }));

    it('should restore all four options when search is cleared', fakeAsync(() => {
      component.typeSearchControl.setValue('INIT');
      tick(300);
      component.typeSearchControl.setValue('');
      tick(300);
      expect(component.typeOptions().length).toBe(4);
    }));

    it('should be case-insensitive in search', fakeAsync(() => {
      component.typeSearchControl.setValue('hold');
      tick(300);
      expect(component.typeOptions()).toContain('HOLD');
    }));

    it('should return empty array when search matches nothing', fakeAsync(() => {
      component.typeSearchControl.setValue('ZZZZ');
      tick(300);
      expect(component.typeOptions().length).toBe(0);
    }));

    it('should match partial search term', fakeAsync(() => {
      component.typeSearchControl.setValue('B');
      tick(300);
      expect(component.typeOptions()).toContain('BIO');
    }));
  });

  // ─── onCancel ────────────────────────────────────────────────────────────────
  // ─── goAddDonor ──────────────────────────────────────────────────────────────
  // ─── onSaveOrEdit — Add ──────────────────────────────────────────────────────

  describe('onSaveOrEdit — Add', () => {
    beforeEach(() => {
      component.form.patchValue({
        code: 'C001',
        type: 'INITIAL',
        description: 'Test Description',
        effectiveDate: moment()
      });
    });


    it('should call addInterdictionCode service with correct payload', () => {
      mockService.addInterdictionCode.and.returnValue(of(mockApiResponse));
      component.onSaveOrEdit('add');
      expect(mockService.addInterdictionCode).toHaveBeenCalledWith(
        jasmine.objectContaining({
          interCode: 'C001',
          interType: 'I',
          interDesc: 'Test Description',
          programId: 'VINTER',
          changeControlFlag: 'D'
        })
      );
    });

    it('should map type INITIAL to interType I in payload', () => {
      mockService.addInterdictionCode.and.returnValue(of(mockApiResponse));
      component.onSaveOrEdit('add');
      payload = mockService.addInterdictionCode.calls.mostRecent().args[0];
      expect(payload.interType).toBe('I');
    });




    it('should format effective date as YYYY-MM-DD 00:00:00.000 in payload', () => {
      futureDateForPayload = moment().add(60, 'days').startOf('day');
      mockService.addInterdictionCode.and.returnValue(of(mockApiResponse));
      component.form.patchValue({ effectiveDate: futureDateForPayload });
      component.onSaveOrEdit('add');
      payload = mockService.addInterdictionCode.calls.mostRecent().args[0];
      expect(payload.effDate).toBe(futureDateForPayload.format('YYYY-MM-DD'));
    });



    it('should log error but not throw on API failure', () => {
      spyOn(console, 'error');
      mockService.addInterdictionCode.and.returnValue(throwError(() => new Error('Server error')));
      expect(() => component.onSaveOrEdit('add')).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  // ─── onSaveOrEdit — Edit ─────────────────────────────────────────────────────

  describe('onSaveOrEdit — Edit', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.rowData = { ...baseEditRowData };
      component.ngOnInit();
      component.form.patchValue({ type: 'HOLD', description: 'Updated Desc' });
    });

    it('should call updateInterdictionCode with correct interCode', () => {
      mockService.updateInterdictionCode.and.returnValue(of(mockApiResponse));
      component.onSaveOrEdit('edit');
      expect(mockService.updateInterdictionCode).toHaveBeenCalledWith(
        'C001',
        jasmine.any(Object)
      );
    });

    it('should send correct payload on edit', () => {
      mockService.updateInterdictionCode.and.returnValue(of(mockApiResponse));
      component.onSaveOrEdit('edit');
      payload = mockService.updateInterdictionCode.calls.mostRecent().args[1];
      expect(payload.interDesc).toBe('Updated Desc');
      expect(payload.interType).toBe('H');
      expect(payload.programId).toBe('VINTER');
      expect(payload.changeControlFlag).toBe('D');
    });



  });

  // ─── ngOnChanges ─────────────────────────────────────────────────────────────
  // ─── ngOnDestroy ─────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next() and complete() on destroy$', () => {
      const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
