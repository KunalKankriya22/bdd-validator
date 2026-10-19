import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import {
  DonorInterdictionFilterComponent,
  DonorInterdictionFilterData,
} from './donor-interdiction-filter';
import { InterdictionLookupItem } from '../services/donor-interdictions';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// ─── Mock ─────────────────────────────────────────────────────────────────────

class MatDialogRefMock {
  close = jasmine.createSpy('close');
}

// ─── Shared type fixtures ─────────────────────────────────────────────────────

const cautnItem: InterdictionLookupItem = { code: 'CAUTN', codeType: 'INTER', description: 'Caution Interdiction' };
const exclItem: InterdictionLookupItem  = { code: 'EXCL',  codeType: 'INTER', description: 'Exclusion Interdiction' };

const dynamicDate   = new Date(Date.now() + 5  * 24 * 60 * 60 * 1000);
const dynamicTerm   = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

// ─── Suite: empty data ────────────────────────────────────────────────────────

describe('DonorInterdictionFilterComponent — empty data', () => {
  let component: DonorInterdictionFilterComponent;
  let fixture: ComponentFixture<DonorInterdictionFilterComponent>;
  let dialogRef: MatDialogRefMock;

  const emptyData: DonorInterdictionFilterData = {
    ownerList: ['D', 'U', 'B'],
    interdictionTypeList: [cautnItem, exclItem],
  };

  beforeEach(() => {

    dialogRef = new MatDialogRefMock();



      TestBed.configureTestingModule({
      imports: [DonorInterdictionFilterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef,    useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: emptyData },
      ],
    });


    



    fixture   = TestBed.createComponent(DonorInterdictionFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Component Creation ──────────────────────────────────────────────────


  it('should initialize ownerList from dialog data', () => {
    expect(component.ownerList).toEqual(['D', 'U', 'B']);
    expect(component.filteredOwnerList).toEqual(['D', 'U', 'B']);
  });



  it('should initialize filteredInterdictionTypeList from dialog data', () => {
    expect(component.filteredInterdictionTypeList.length).toBe(2);
  });

  it('should initialize effectivePeriodRequired as false', () => {
    expect(component.effectivePeriodRequired).toBeFalse();
  });

  it('should initialize terminationPeriodRequired as false', () => {
    expect(component.terminationPeriodRequired).toBeFalse();
  });

  it('should initialize yesNoOptions with Y and N', () => {
    expect(component.yesNoOptions.length).toBe(2);
    expect(component.yesNoOptions.find(o => o.value === 'Y')).toBeTruthy();
    expect(component.yesNoOptions.find(o => o.value === 'N')).toBeTruthy();
  });

  it('should initialize filterForm controls with empty values', () => {
    expect(component.filterForm.get('owner')?.value).toBe('');
    expect(component.filterForm.get('interdictionType')?.value).toBe('');
    expect(component.filterForm.get('deferral')?.value).toBe('');
    expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
  });

  // ─── Owner Search ─────────────────────────────────────────────────────────

  it('should filter owners by display name on ownerSearchControl change', fakeAsync(() => {
    component.ownerSearchControl.setValue('Donor');
    tick(50);
    expect(component.filteredOwnerList).toContain('D');
    expect(component.filteredOwnerList).not.toContain('U');
    expect(component.filteredOwnerList).not.toContain('B');
  }));

  it('should be case-insensitive when filtering owners', fakeAsync(() => {
    component.ownerSearchControl.setValue('donor');
    tick(50);
    expect(component.filteredOwnerList).toContain('D');
  }));

  it('should restore all owners when owner search is cleared', fakeAsync(() => {
    component.ownerSearchControl.setValue('Donor');
    tick(50);
    component.ownerSearchControl.setValue('');
    tick(50);
    expect(component.filteredOwnerList).toEqual(['D', 'U', 'B']);
  }));

  it('should return empty filteredOwnerList when search matches nothing', fakeAsync(() => {
    component.ownerSearchControl.setValue('ZZZZZ');
    tick(50);
    expect(component.filteredOwnerList.length).toBe(0);
  }));

  it('should match Unit for owner search U', fakeAsync(() => {
    component.ownerSearchControl.setValue('Unit');
    tick(50);
    expect(component.filteredOwnerList).toContain('U');
    expect(component.filteredOwnerList).not.toContain('D');
  }));

  it('should match Both for owner search B', fakeAsync(() => {
    component.ownerSearchControl.setValue('Both');
    tick(50);
    expect(component.filteredOwnerList).toContain('B');
  }));

  // ─── Interdiction Type Search ─────────────────────────────────────────────



  it('should filter interdiction types by description', fakeAsync(() => {
    component.interdictionTypeSearchControl.setValue('Caution');
    tick(50);
    expect(component.filteredInterdictionTypeList.some(t => t.code === 'CAUTN')).toBeTrue();
  }));

  it('should be case-insensitive when filtering interdiction types', fakeAsync(() => {
    component.interdictionTypeSearchControl.setValue('cautn');
    tick(50);
    expect(component.filteredInterdictionTypeList.some(t => t.code === 'CAUTN')).toBeTrue();
  }));

  it('should restore all types when interdiction type search is cleared', fakeAsync(() => {
    component.interdictionTypeSearchControl.setValue('CAUTN');
    tick(50);
    component.interdictionTypeSearchControl.setValue('');
    tick(50);
    expect(component.filteredInterdictionTypeList.length).toBe(2);
  }));



  // ─── getOwnerDisplayName ──────────────────────────────────────────────────

  it('should return Donor (D) for code D', () => {
    expect(component.getOwnerDisplayName('D')).toBe('Donor (D)');
  });

  it('should return Unit (U) for code U', () => {
    expect(component.getOwnerDisplayName('U')).toBe('Unit (U)');
  });

  it('should return Both (B) for code B', () => {
    expect(component.getOwnerDisplayName('B')).toBe('Both (B)');
  });

  it('should return code itself for unknown owner code', () => {
    expect(component.getOwnerDisplayName('X')).toBe('X (X)');
  });

  // ─── Effective Date Errors ────────────────────────────────────────────────









  // ─── Termination Date Errors ──────────────────────────────────────────────







  // ─── effectivePeriodRequired ──────────────────────────────────────────────

  it('should set effectivePeriodRequired true when valid date set without period', fakeAsync(() => {
    component.filterForm.get('effectiveDate')?.setValue(dynamicDate);
    tick(0);
    expect(component.effectivePeriodRequired).toBeTrue();
  }));

  it('should clear effectivePeriodRequired when period is then selected', fakeAsync(() => {
    component.filterForm.get('effectiveDate')?.setValue(dynamicDate);
    tick(0);
    component.filterForm.get('effectivePeriod')?.setValue('AFTER');
    expect(component.effectivePeriodRequired).toBeFalse();
  }));

  it('should not set effectivePeriodRequired when date is null', () => {
    component.filterForm.get('effectiveDate')?.setValue(null);
    expect(component.effectivePeriodRequired).toBeFalse();
  });

  it('should not set effectivePeriodRequired when date has a parse error', fakeAsync(() => {
    const ctrl = component.filterForm.get('effectiveDate')!;
    ctrl.setErrors({ matDatepickerParse: { text: 'bad' } });
    tick(0);
    expect(component.effectivePeriodRequired).toBeFalse();
  }));

  // ─── terminationPeriodRequired ────────────────────────────────────────────

  it('should set terminationPeriodRequired true when valid date set without period', fakeAsync(() => {
    component.filterForm.get('terminationDate')?.setValue(dynamicTerm);
    tick(0);
    expect(component.terminationPeriodRequired).toBeTrue();
  }));

  it('should clear terminationPeriodRequired when period is then selected', fakeAsync(() => {
    component.filterForm.get('terminationDate')?.setValue(dynamicTerm);
    tick(0);
    component.filterForm.get('terminationPeriod')?.setValue('BEFORE');
    expect(component.terminationPeriodRequired).toBeFalse();
  }));

  it('should not set terminationPeriodRequired when date is null', () => {
    component.filterForm.get('terminationDate')?.setValue(null);
    expect(component.terminationPeriodRequired).toBeFalse();
  });

  it('should not set terminationPeriodRequired when date has a parse error', fakeAsync(() => {
    const ctrl = component.filterForm.get('terminationDate')!;
    ctrl.setErrors({ matDatepickerParse: { text: 'bad' } });
    tick(0);
    expect(component.terminationPeriodRequired).toBeFalse();
  }));

  // ─── isApplyDisabled ──────────────────────────────────────────────────────



















  // ─── onApply ─────────────────────────────────────────────────────────────











  // ─── onClear ─────────────────────────────────────────────────────────────

  it('should reset all form controls on onClear', () => {
    component.filterForm.patchValue({
      owner: 'D',
      interdictionType: 'CAUTN',
      deferral: 'Y',
      effectivePeriod: 'AFTER',
      effectiveDate: dynamicDate,
      terminationPeriod: 'BEFORE',
      terminationDate: dynamicTerm,
    });
    component.onClear();
    expect(component.filterForm.get('owner')?.value).toBe('');
    expect(component.filterForm.get('interdictionType')?.value).toBe('');
    expect(component.filterForm.get('deferral')?.value).toBe('');
    expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
  });





  // ─── closeDialog ─────────────────────────────────────────────────────────



  // ─── Date Input Handlers ──────────────────────────────────────────────────

  it('should mark effectiveDate as touched on onEffectiveDateInput', () => {
    const input = document.createElement('input');
    input.value = '01-JAN-2026';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });

    const ctrl = component.filterForm.get('effectiveDate')!;
    expect(ctrl.touched).toBeFalse();
    component.onEffectiveDateInput(event);
    expect(ctrl.touched).toBeTrue();
  });

  it('should mark terminationDate as touched on onTerminationDateInput', () => {
    const input = document.createElement('input');
    input.value = '01-JUN-2027';
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input });

    const ctrl = component.filterForm.get('terminationDate')!;
    expect(ctrl.touched).toBeFalse();
    component.onTerminationDateInput(event);
    expect(ctrl.touched).toBeTrue();
  });



  // ─── ngOnDestroy ─────────────────────────────────────────────────────────


});

// ─── Suite: pre-populated data ────────────────────────────────────────────────

describe('DonorInterdictionFilterComponent — pre-populated data', () => {
  let component: DonorInterdictionFilterComponent;
  let fixture: ComponentFixture<DonorInterdictionFilterComponent>;
  let dialogRef: MatDialogRefMock;

  const prePopEffDate  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const prePopTermDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  const prePopData: DonorInterdictionFilterData = {
    owner: 'D',
    interdictionType: 'CAUTN',
    deferral: 'Y',
    effectivePeriod: 'AFTER',
    effectiveDate: prePopEffDate,
    terminationPeriod: 'BEFORE',
    terminationDate: prePopTermDate,
    ownerList: ['D', 'U', 'B'],
    interdictionTypeList: [cautnItem, exclItem],
  };

  beforeEach(async () => {
    dialogRef = new MatDialogRefMock();

    TestBed.configureTestingModule({
      imports: [DonorInterdictionFilterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef,    useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: prePopData },
      ],
    });

    fixture   = TestBed.createComponent(DonorInterdictionFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });



  it('should populate owner from dialog data', () => {
    expect(component.filterForm.get('owner')?.value).toBe('D');
  });

  it('should populate interdictionType from dialog data', () => {
    expect(component.filterForm.get('interdictionType')?.value).toBe('CAUTN');
  });

  it('should populate deferral from dialog data', () => {
    expect(component.filterForm.get('deferral')?.value).toBe('Y');
  });

  it('should populate effectivePeriod from dialog data', () => {
    expect(component.filterForm.get('effectivePeriod')?.value).toBe('AFTER');
  });

  it('should populate effectiveDate from dialog data', () => {
    expect(component.filterForm.get('effectiveDate')?.value).toEqual(prePopEffDate);
  });

  it('should populate terminationPeriod from dialog data', () => {
    expect(component.filterForm.get('terminationPeriod')?.value).toBe('BEFORE');
  });

  it('should populate terminationDate from dialog data', () => {
    expect(component.filterForm.get('terminationDate')?.value).toEqual(prePopTermDate);
  });

  it('should not set effectivePeriodRequired when period is already set', () => {
    expect(component.effectivePeriodRequired).toBeFalse();
  });

  it('should not set terminationPeriodRequired when period is already set', () => {
    expect(component.terminationPeriodRequired).toBeFalse();
  });





  it('should clear all fields including pre-populated ones on onClear', () => {
    component.onClear();
    expect(component.filterForm.get('owner')?.value).toBe('');
    expect(component.filterForm.get('interdictionType')?.value).toBe('');
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
  });

  it('should disable apply button after clearing (no values)', () => {
    component.onClear();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should become disabled after clearing period for a date that remains set', fakeAsync(() => {
    // Set date without period by clearing effectivePeriod
    component.filterForm.patchValue({ effectivePeriod: null });
    tick(0);
    expect(component.effectivePeriodRequired).toBeTrue();
    expect(component.isApplyDisabled).toBeTrue();
  }));

  it('should remain enabled when owner only is selected after clear', () => {
    component.onClear();
    component.filterForm.get('owner')?.setValue('U');
    expect(component.isApplyDisabled).toBeFalse();
  });
});
