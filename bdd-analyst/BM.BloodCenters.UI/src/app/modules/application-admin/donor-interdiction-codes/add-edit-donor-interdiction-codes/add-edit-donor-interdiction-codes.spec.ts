import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditDonorInterdictionCodesComponent } from './add-edit-donor-interdiction-codes';
import {
  DonorInterdictionsService,
  DonorInterdiction,
  InterdictionDropdownDto,
  LabFlagLookup,
} from '../services/donor-interdictions';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

// ─── Mocks ────────────────────────────────────────────────────────────────────

class DonorInterdictionsServiceMock {
  create = jasmine.createSpy('create').and.returnValue(of('SUCCESS'));
  update = jasmine.createSpy('update').and.returnValue(of('UPDATED'));
  getViewLimit = jasmine.createSpy('getViewLimit').and.returnValue(of(10));
}

class MatSnackBarMock {
  open = jasmine.createSpy('open');
}

class RouterMock {
  navigate = jasmine.createSpy('navigate');
}

class HeaderServiceMock {
  chapterTimeZone = jasmine.createSpy('chapterTimeZone').and.returnValue('UTC');
}

// ─── Dynamic test dates ────────────────────────────────────────────────────────

const today       = moment().startOf('day');
const tomorrow    = moment().add(1, 'days').startOf('day');
const dayAfterTom = moment().add(2, 'days').startOf('day');
const pastDate    = moment().subtract(30, 'days').startOf('day');
const futureDate  = moment().add(90, 'days').startOf('day');

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const mockDropdowns: InterdictionDropdownDto = {
  types: ['CAUTN', 'EXCL'],
  typeItems: [
    { code: 'CAUTN', codeType: 'INTER', description: 'Caution' },
    { code: 'EXCL',  codeType: 'INTER', description: 'Exclusion' },
  ],
  owners: ['D', 'U', 'B'],
  fixedPeriods: ['Y', 'N'],
  periods: ['Days', 'P'],
  periodItems: [
    { code: 'Days', codeType: 'PERIOD', description: 'Days' },
    { code: 'P',    codeType: 'PERIOD', description: 'Permanent' },
  ],
  labFlags: ['Y', 'N'],
  viewLimit: 3,
};

const mockLabFlagLookup: LabFlagLookup[] = [
  { code: 'A', codeType: 'LBHLD', description: 'Discard all products from donor' },
  { code: 'N', codeType: 'LBHLD', description: 'No effect on unit collections' },
];

const mockEditData: DonorInterdiction = {
  code: 'ADH',
  type: 'CAUTN',
  owner: 'D',
  deferral: 'Y',
  multipleFlag: 'N',
  terminationReason: 'Y',
  viewLevel: 1,
  effectiveDate: pastDate.format('YYYY-MM-DD'),
  terminationDate: futureDate.format('YYYY-MM-DD'),
  lastModifiedDate: pastDate.format('YYYY-MM-DD') + ' 10:00:00',
};

const mockSystemControlledData: DonorInterdiction = {
  ...mockEditData,
  changeControlFlag: 'S',
};

function fillValidAddForm(c: AddEditDonorInterdictionCodesComponent): void {
  c.form.patchValue({
    panelMode: 'Donor',
    code: 'NEW',
    type: 'CAUTN',
    owner: 'D',
    description: 'Test Description',
    deferral: 'Y',
    multipleFlag: 'N',
    terminationReason: 'Y',
    viewLevel: 1,
    effectiveDate: tomorrow.clone(),
  });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AddEditDonorInterdictionCodesComponent', () => {
  let component: AddEditDonorInterdictionCodesComponent;
  let fixture: ComponentFixture<AddEditDonorInterdictionCodesComponent>;
  let service: DonorInterdictionsServiceMock;
  let snackBar: MatSnackBarMock;
  let router: RouterMock;

  beforeEach(() => {

    // Clear any ChapterTimezoneService leaked from a previous test in the full suite,
    // so getToday() falls back to browser local time — consistent with how this spec
    // computes `today` via moment().startOf('day').
    DateFieldValidationUtility.setChapterTimezoneService(null as any);



      TestBed.configureTestingModule({
      imports: [AddEditDonorInterdictionCodesComponent, NoopAnimationsModule],
      providers: [
        { provide: DonorInterdictionsService, useClass: DonorInterdictionsServiceMock },
        { provide: MatSnackBar,              useClass: MatSnackBarMock },
        { provide: Router,                   useClass: RouterMock },
        { provide: HeaderService,            useClass: HeaderServiceMock },
      ],
    });


    



    fixture   = TestBed.createComponent(AddEditDonorInterdictionCodesComponent);
    component = fixture.componentInstance;
    service   = TestBed.inject(DonorInterdictionsService) as unknown as DonorInterdictionsServiceMock;
    snackBar  = TestBed.inject(MatSnackBar) as unknown as MatSnackBarMock;
    router    = TestBed.inject(Router) as unknown as RouterMock;

    component.dropdowns           = mockDropdowns;
    component.labFlagLookupOptions = mockLabFlagLookup;
    component.mode = 'add';
    component.data = null;

    fixture.detectChanges();


    });

  // ─── Component Creation ────────────────────────────────────────────────────

  describe('Component Creation', () => {


    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBeFalse();
    });

    it('should initialize lastUpdated as empty string in add mode', () => {
      expect(component.lastUpdated).toBe('');
    });
  });

  // ─── Dropdown Population ───────────────────────────────────────────────────

  describe('Dropdown Population', () => {
    it('should populate types signal with InterdictionLookupItem objects', () => {
      expect(component.types().length).toBe(2);
      expect(component.types().some(t => t.code === 'CAUTN')).toBeTrue();
      expect(component.types().some(t => t.code === 'EXCL')).toBeTrue();
    });

    it('should populate owners signal from built-in list', () => {
      expect(component.owners()).toContain('D');
      expect(component.owners()).toContain('U');
      expect(component.owners()).toContain('B');
    });

    it('should populate periods signal with InterdictionLookupItem objects', () => {
      expect(component.periods().length).toBe(2);
      expect(component.periods().some(p => p.code === 'Days')).toBeTrue();
      expect(component.periods().some(p => p.code === 'P')).toBeTrue();
    });



    it('should set fixedPeriods from dropdowns', () => {
      expect(component.fixedPeriods).toContain('Y');
      expect(component.fixedPeriods).toContain('N');
    });

    it('should set viewLimit from API', () => {
      expect(component.viewLimit).toBe(10);
    });

    it('should generate viewLevels starting from 1', () => {
      expect(component.viewLevels[0]).toBe(1);
    });

    it('should generate viewLevels up to and including viewLimit', () => {
      expect(component.viewLevels[component.viewLevels.length - 1]).toBe(component.viewLimit);
    });

    it('should not include 0 in viewLevels', () => {
      expect(component.viewLevels).not.toContain(0);
    });

    it('should include viewLimit as a valid view level', () => {
      expect(component.viewLevels).toContain(component.viewLimit);
    });

    it('should generate correct number of viewLevels', () => {
      expect(component.viewLevels.length).toBe(component.viewLimit);
    });

    it('should initialize filteredViewLevels equal to viewLevels', () => {
      expect(component.filteredViewLevels).toEqual(component.viewLevels);
    });
  });

  // ─── Form Initialization — Add Mode ───────────────────────────────────────

  describe('Form Initialization — Add Mode', () => {
    it('should build form with all required controls', () => {
      const names = [
        'panelMode', 'code', 'type', 'owner', 'description', 'deferral',
        'fixedPeriod', 'period', 'value', 'minValue', 'terminationReason',
        'viewLevel', 'multipleFlag', 'upgradeFlag', 'manualFlag', 'labFlag',
        'effectiveDate', 'terminationDate', 'labInterdiction', 'oldInterdiction',
      ];
      names.forEach(n => expect(component.form.get(n)).withContext(n).toBeTruthy());
    });



    it('should have panelMode enabled in add mode', () => {
      expect(component.form.get('panelMode')?.enabled).toBeTrue();
    });

    it('should have effectiveDate enabled in add mode', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should have code enabled in add mode', () => {
      expect(component.form.get('code')?.enabled).toBeTrue();
    });

    it('should initialize effectiveDate as null', () => {
      expect(component.form.get('effectiveDate')?.value).toBeNull();
    });

    it('should initialize terminationDate as null', () => {
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should start with an invalid form (required fields empty)', () => {
      expect(component.form.invalid).toBeTrue();
    });
  });

  // ─── Form Initialization — Edit Mode ──────────────────────────────────────

  describe('Form Initialization — Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false),
      });
    });





    it('should populate code from data', () => {
      expect(component.form.get('code')?.value).toBe('ADH');
    });

    it('should populate type from data', () => {
      expect(component.form.get('type')?.value).toBe('CAUTN');
    });

    it('should populate owner from data', () => {
      expect(component.form.get('owner')?.value).toBe('D');
    });

    it('should populate deferral from data', () => {
      expect(component.form.get('deferral')?.value).toBe('Y');
    });

    it('should populate multipleFlag from data', () => {
      expect(component.form.get('multipleFlag')?.value).toBe('N');
    });

    it('should populate viewLevel from data', () => {
      expect(component.form.get('viewLevel')?.value).toBe(1);
    });

    it('should populate effectiveDate as moment from data', () => {
      const ctrl = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(ctrl)).toBeTrue();
      expect(ctrl.format('YYYY-MM-DD')).toBe(pastDate.format('YYYY-MM-DD'));
    });

    it('should populate terminationDate as moment from data', () => {
      const ctrl = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(ctrl)).toBeTrue();
      expect(ctrl.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });



    it('should set lastUpdated from data.lastModifiedDate', () => {
      expect(component.lastUpdated).toContain('Last Updated:');
    });



    it('should set terminationDate to null when data has no terminationDate', () => {
      const { terminationDate: _, ...noTerm } = mockEditData;
      component.data = noTerm as DonorInterdiction;
      component.ngOnChanges({ data: new SimpleChange(mockEditData, component.data, false) });
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });
  });

  // ─── isSystemControlled ────────────────────────────────────────────────────

  describe('isSystemControlled', () => {
    it('should return false when changeControlFlag is not S', () => {
      component.data = { ...mockEditData };
      expect(component.isSystemControlled).toBeFalse();
    });

    it('should return true when changeControlFlag is S', () => {
      component.data = mockSystemControlledData;
      expect(component.isSystemControlled).toBeTrue();
    });

    it('should return false when data is null', () => {
      component.data = null;
      expect(component.isSystemControlled).toBeFalse();
    });
  });

  // ─── System-Controlled Mode ────────────────────────────────────────────────

  describe('System-Controlled Mode (changeControlFlag = S)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockSystemControlledData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false),
      });
    });

    it('isSystemControlled should return true', () => {
      expect(component.isSystemControlled).toBeTrue();
    });

    it('effectiveDate should still be disabled in system-controlled mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
    });

    it('non-system fields should remain enabled', () => {
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });
  });

  // ─── Effective Date Validation ─────────────────────────────────────────────

  describe('Effective Date Validation', () => {






    it('should return past-date error when effectiveDatePast error is set', () => {
      component.form.get('effectiveDate')?.setValue(moment().subtract(1, 'day'));
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be in the past');
    });

    it('should return past-date error when matDatepickerMin error is set', () => {
      const ctrl = component.form.get('effectiveDate')!;
      ctrl.setErrors({ matDatepickerMin: true });
      ctrl.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be in the past');
    });





    it('should not show error in edit mode (effectiveDate is disabled)', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, effectiveDate: moment().subtract(5, 'years').format('YYYY-MM-DD') };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false),
      });
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  // ─── Termination Date Validation ───────────────────────────────────────────

  describe('Termination Date Validation', () => {








    it('should return past-date error when terminationDate is yesterday', () => {
      component.form.get('terminationDate')?.setValue(moment().subtract(1, 'day'));
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be in the past');
    });

    it('should return range error when terminationDate is before effectiveDate', () => {
      component.form.patchValue({
        effectiveDate: moment().add(5, 'days').startOf('day'),
        terminationDate: moment().add(2, 'days').startOf('day'),
      });
      component.form.markAllAsTouched();
      expect(component.getTerminationDateError()).toContain('on or after Effective Date');
    });





    it('should re-validate terminationDate when effectiveDate changes', () => {
      component.form.patchValue({
        effectiveDate: tomorrow.clone(),
        terminationDate: dayAfterTom.clone(),
      });
      component.form.markAllAsTouched();
      expect(component.getTerminationDateError()).toBe('');

      component.form.patchValue({ effectiveDate: moment().add(10, 'days') });
      expect(component.getTerminationDateError()).toContain('on or after');
    });
  });

  // ─── Termination Date Filter ───────────────────────────────────────────────

  describe('terminationDateFilter', () => {


    it('should return false for a date in the past', () => {
      const pastMoment = moment().subtract(1, 'day');
      expect(component.terminationDateFilter(pastMoment)).toBeFalse();
    });

    it('should return true for today', () => {
      const todayMoment = moment().startOf('day');
      expect(component.terminationDateFilter(todayMoment)).toBeTrue();
    });

    it('should return true for a future date with no effective date set', () => {
      expect(component.terminationDateFilter(futureDate.clone())).toBeTrue();
    });

    it('should return false for date before effective date', () => {
      component.form.patchValue({ effectiveDate: moment().add(5, 'days') });
      expect(component.terminationDateFilter(moment().add(2, 'days'))).toBeFalse();
    });

    it('should return true for date equal to effective date', () => {
      const effDate = moment().add(5, 'days').startOf('day');
      component.form.patchValue({ effectiveDate: effDate.clone() });
      expect(component.terminationDateFilter(effDate.clone())).toBeTrue();
    });
  });

  // ─── hasVisibleDateError ───────────────────────────────────────────────────

  describe('hasVisibleDateError', () => {
    it('should return false when no date fields are touched', () => {
      expect(component.hasVisibleDateError).toBeFalse();
    });

    it('should return false when both dates are valid and touched', () => {
      component.form.patchValue({
        effectiveDate: tomorrow.clone(),
        terminationDate: dayAfterTom.clone(),
      });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeFalse();
    });

    it('should return true when effectiveDate has required error', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when effectiveDate is in the past', () => {
      component.form.get('effectiveDate')?.setValue(moment().subtract(1, 'day'));
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when terminationDate is in the past', () => {
      component.form.patchValue({ effectiveDate: tomorrow.clone() });
      component.form.get('terminationDate')?.setValue(moment().subtract(1, 'day'));
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });

    it('should return true when terminationDate is before effectiveDate', () => {
      component.form.patchValue({
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(2, 'days'),
      });
      component.form.markAllAsTouched();
      expect(component.hasVisibleDateError).toBeTrue();
    });
  });

  // ─── hasVisibleFormErrors ──────────────────────────────────────────────────

  describe('hasVisibleFormErrors', () => {
    it('should return false when no controls are touched or dirty', () => {
      expect(component.hasVisibleFormErrors).toBeFalse();
    });

    it('should return true when a touched control is invalid', () => {
      component.form.get('code')?.markAsTouched();
      // code is required and empty → invalid
      expect(component.hasVisibleFormErrors).toBeTrue();
    });

    it('should return false when all touched controls are valid', () => {
      fillValidAddForm(component);
      component.form.get('code')?.markAsTouched();
      expect(component.hasVisibleFormErrors).toBeFalse();
    });
  });

  // ─── Form Validity — Button Enable/Disable ─────────────────────────────────

  describe('Form Validity — Button Enable/Disable', () => {


































    it('should be valid without terminationDate (optional field)', () => {
      fillValidAddForm(component);
      component.form.patchValue({ terminationDate: null });
      expect(component.form.valid).toBeTrue();
    });





    it('should mark all controls as touched when save attempted on invalid form', () => {
      component.onSave();
      expect(component.form.get('code')?.touched).toBeTrue();
      expect(component.form.get('type')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  // ─── Period → value/minValue required ─────────────────────────────────────

  describe('Period Value Changes', () => {
    it('should make value required when period is non-P (M, D, Y, etc.)', () => {
      component.form.patchValue({ period: 'Days' });
      expect(component.form.get('value')?.hasError('required')).toBeTrue();
    });

    it('should NOT make minValue required when period is non-P (M, D, Y, etc.)', () => {
      component.form.patchValue({ period: 'Days' });
      expect(component.form.get('minValue')?.hasError('required')).toBeFalse();
    });

    it('should not require value when period is P', () => {
      component.form.patchValue({ period: 'P' });
      expect(component.form.get('value')?.hasError('required')).toBeFalse();
    });

    it('should not require minValue when period is P', () => {
      component.form.patchValue({ period: 'P' });
      expect(component.form.get('minValue')?.hasError('required')).toBeFalse();
    });

    it('should not require value when period is empty', () => {
      component.form.patchValue({ period: '' });
      expect(component.form.get('value')?.hasError('required')).toBeFalse();
    });

    it('should not require minValue when period is empty', () => {
      component.form.patchValue({ period: '' });
      expect(component.form.get('minValue')?.hasError('required')).toBeFalse();
    });
  });

  // ─── Search Filters ────────────────────────────────────────────────────────

  describe('Type Search Filter', () => {


    it('should restore all types when search is cleared', fakeAsync(() => {
      component.typeSearchControl.setValue('CAUT');
      tick(300);
      component.typeSearchControl.setValue('');
      tick(300);
      expect(component.types().length).toBe(2);
    }));

    it('should be case-insensitive for type search', fakeAsync(() => {
      component.typeSearchControl.setValue('cautn');
      tick(300);
      expect(component.types().some(t => t.code === 'CAUTN')).toBeTrue();
    }));

    it('should filter by description as well', fakeAsync(() => {
      component.typeSearchControl.setValue('Caution');
      tick(300);
      expect(component.types().some(t => t.code === 'CAUTN')).toBeTrue();
    }));


  });

  describe('Owner Search Filter', () => {
    it('should filter owner options by display name', fakeAsync(() => {
      component.ownerSearchControl.setValue('Donor');
      tick(300);
      expect(component.owners()).toContain('D');
      expect(component.owners().length).toBe(1);
    }));

    it('should restore all owners when search is cleared', fakeAsync(() => {
      component.ownerSearchControl.setValue('Donor');
      tick(300);
      component.ownerSearchControl.setValue('');
      tick(300);
      expect(component.owners().length).toBe(3);
    }));
  });

  describe('Period Search Filter', () => {


    it('should restore all periods when search is cleared', fakeAsync(() => {
      component.periodSearchControl.setValue('Days');
      tick(300);
      component.periodSearchControl.setValue('');
      tick(300);
      expect(component.periods().length).toBe(2);
    }));
  });

  describe('LabFlag Search Filter', () => {


    it('should filter labFlag options by description', fakeAsync(() => {
      component.labFlagSearchControl.setValue('Discard');
      tick(300);
      expect(component.labFlagOptions().some(o => o.code === 'A')).toBeTrue();
    }));

    it('should restore all labFlag options when search is cleared', fakeAsync(() => {
      component.labFlagSearchControl.setValue('A');
      tick(300);
      component.labFlagSearchControl.setValue('');
      tick(300);
      expect(component.labFlagOptions().length).toBe(2);
    }));
  });

  // ─── getOwnerDisplayName ───────────────────────────────────────────────────

  describe('getOwnerDisplayName', () => {
    it('should return Donor (D) for code D', () => {
      expect(component.getOwnerDisplayName('D')).toBe('Donor (D)');
    });

    it('should return Unit (U) for code U', () => {
      expect(component.getOwnerDisplayName('U')).toBe('Unit (U)');
    });

    it('should return Both (B) for code B', () => {
      expect(component.getOwnerDisplayName('B')).toBe('Both (B)');
    });

    it('should return code itself for unknown codes', () => {
      expect(component.getOwnerDisplayName('X')).toBe('X (X)');
    });
  });

  // ─── getYesNoDisplay ──────────────────────────────────────────────────────

  describe('getYesNoDisplay', () => {
    it('should return Yes for Y', () => {
      expect(component.getYesNoDisplay('Y')).toBe('Yes');
    });

    it('should return No for N', () => {
      expect(component.getYesNoDisplay('N')).toBe('No');
    });






  });

  // ─── preventSpaceInput ────────────────────────────────────────────────────
  // ─── preventLeadingAndMultipleSpaces ──────────────────────────────────────
  // ─── trimTrailingSpaces ───────────────────────────────────────────────────

  describe('trimTrailingSpaces', () => {
    it('should trim trailing spaces from a field value', () => {
      component.form.patchValue({ description: 'hello   ' });
      component.trimTrailingSpaces('description');
      expect(component.form.get('description')?.value).toBe('hello');
    });

    it('should leave value unchanged when no trailing spaces', () => {
      component.form.patchValue({ description: 'hello' });
      component.trimTrailingSpaces('description');
      expect(component.form.get('description')?.value).toBe('hello');
    });

    it('should handle empty string without error', () => {
      component.form.patchValue({ description: '' });
      component.trimTrailingSpaces('description');
      expect(component.form.get('description')?.value).toBe('');
    });
  });

  // ─── onIntegerKeyDown ─────────────────────────────────────────────────────
  // ─── onSave — Add Mode ─────────────────────────────────────────────────────

  describe('onSave — Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fillValidAddForm(component);
    });



    it('should call create with correct payload on valid save', fakeAsync(() => {
      component.onSave();
      tick();
      expect(service.create).toHaveBeenCalledWith(
        jasmine.objectContaining({ code: 'NEW', type: 'CAUTN', owner: 'D', multipleFlag: 'N' })
      );
    }));

    it('should format effectiveDate as YYYY-MM-DD in payload', fakeAsync(() => {
      const futureDay = moment().add(3, 'days').startOf('day');
      component.form.patchValue({ effectiveDate: futureDay });
      component.onSave();
      tick();
      const payload = (service.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(payload.effectiveDate).toBe(futureDay.format('YYYY-MM-DD'));
    }));

    it('should format terminationDate as YYYY-MM-DD when set', fakeAsync(() => {
      component.form.patchValue({ terminationDate: dayAfterTom.clone() });
      component.onSave();
      tick();
      const payload = (service.create as jasmine.Spy).calls.mostRecent().args[0];
      expect(payload.terminationDate).toBe(dayAfterTom.format('YYYY-MM-DD'));
    }));









    it('should set isSaving to false after successful save', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should set isSaving to false after API error', fakeAsync(() => {
      (service.create as jasmine.Spy).and.returnValue(throwError(() => new Error('fail')));
      spyOn(console, 'error');
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));


  });

  // ─── onSave — Edit Mode ────────────────────────────────────────────────────

  describe('onSave — Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockEditData };
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, component.data, false),
      });
    });

    it('should call update (not create) in edit mode', fakeAsync(() => {
      component.onSave();
      tick();
      expect(service.update).toHaveBeenCalled();
      expect(service.create).not.toHaveBeenCalled();
    }));

    it('should include oldType in update payload', fakeAsync(() => {
      component.onSave();
      tick();
      const payload = (service.update as jasmine.Spy).calls.mostRecent().args[0];
      expect(payload.oldType).toBe('CAUTN');
    }));







    it('should set isSaving to false after successful edit', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.isSaving).toBeFalse();
    }));


  });

  // ─── onCancel ──────────────────────────────────────────────────────────────
  // ─── goToAddLab ────────────────────────────────────────────────────────────
  // ─── minDate ───────────────────────────────────────────────────────────────

  describe('minDate', () => {
    it('should return today at start of day (based on chapter timezone)', () => {
      expect(component.minDate.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
    });
  });

  // ─── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should call next() and complete() on destroy$', () => {
      const nextSpy     = spyOn(component['destroy$'], 'next').and.callThrough();
      const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
