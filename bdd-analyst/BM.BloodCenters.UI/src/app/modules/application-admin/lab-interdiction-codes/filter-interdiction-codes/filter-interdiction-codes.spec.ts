import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FilterInterdictionCodes, LabInterdictionFilterData } from './filter-interdiction-codes';

describe('FilterInterdictionCodes', () => {
  let component: FilterInterdictionCodes;
  let fixture: ComponentFixture<FilterInterdictionCodes>;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<FilterInterdictionCodes>>;

  beforeEach(() => {

    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [FilterInterdictionCodes],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    });


    


      dialogRefMock.close.calls.reset();


    fixture = TestBed.createComponent(FilterInterdictionCodes);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Component Creation ──────────────────────────────────────────────────────

  describe('Component Creation', () => {


    it('should initialize filter form with all controls', () => {
      expect(component.filterForm.get('type')).toBeTruthy();
      expect(component.filterForm.get('system')).toBeTruthy();
      expect(component.filterForm.get('effectivePeriod')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('terminationPeriod')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
    });

    it('should initialize form controls with null values when no data provided', () => {
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('system')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should initialize with four type options', () => {
      expect(component.typeOptions.length).toBe(4);
      expect(component.typeOptions.map(o => o.label)).toContain('INITIAL');
      expect(component.typeOptions.map(o => o.label)).toContain('HOLD');
      expect(component.typeOptions.map(o => o.label)).toContain('BIO');
      expect(component.typeOptions.map(o => o.label)).toContain('NFT');
    });

    it('should initialize filteredTypeOptions with all type options', () => {
      expect(component.filteredTypeOptions.length).toBe(4);
    });

    it('should initialize with two system options (YES / NO)', () => {
      expect(component.systemOptions.length).toBe(2);
      expect(component.systemOptions.map(o => o.label)).toContain('YES');
      expect(component.systemOptions.map(o => o.label)).toContain('NO');
    });

    it('should initialize effectivePeriodRequired as false', () => {
      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should initialize terminationPeriodRequired as false', () => {
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  // ─── Type Search ─────────────────────────────────────────────────────────────

  describe('Type Search', () => {
    it('should filter type options by label when searching', () => {
      component.typeSearchControl.setValue('INIT');
      expect(component.filteredTypeOptions.map(o => o.label)).toContain('INITIAL');
      expect(component.filteredTypeOptions.length).toBe(1);
    });

    it('should filter type options by value when searching', () => {
      component.typeSearchControl.setValue('H');
      const labels = component.filteredTypeOptions.map(o => o.label);
      expect(labels).toContain('HOLD');
    });

    it('should restore all options when search is cleared', () => {
      component.typeSearchControl.setValue('INIT');
      component.typeSearchControl.setValue('');
      expect(component.filteredTypeOptions.length).toBe(4);
    });

    it('should be case-insensitive in type search', () => {
      component.typeSearchControl.setValue('hold');
      expect(component.filteredTypeOptions.map(o => o.label)).toContain('HOLD');
    });

    it('should return empty when no type matches search', () => {
      component.typeSearchControl.setValue('ZZZZZ');
      expect(component.filteredTypeOptions.length).toBe(0);
    });
  });

  // ─── Effective Date Error Messages ───────────────────────────────────────────
  // ─── Termination Date Error Messages ─────────────────────────────────────────
  // ─── effectivePeriodRequired ─────────────────────────────────────────────────

  describe('effectivePeriodRequired', () => {
    it('should be false initially', () => {
      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should be true when effective date is set but period is not', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectivePeriod: null });
      tick(0);
      component['validateEffectivePeriod']();
      expect(component.effectivePeriodRequired).toBeTrue();
    }));

    it('should be false when effective date and period are both set', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectivePeriod: 'After' });
      tick(0);
      component['validateEffectivePeriod']();
      expect(component.effectivePeriodRequired).toBeFalse();
    }));

    it('should be false when effective date is not set', () => {
      component.filterForm.patchValue({ effectiveDate: null, effectivePeriod: null });
      component['validateEffectivePeriod']();
      expect(component.effectivePeriodRequired).toBeFalse();
    });

    it('should be false when effective date has parse error', () => {
      const control = component.filterForm.get('effectiveDate')!;
      control.setErrors({ matDatepickerParse: true });
      component['validateEffectivePeriod']();
      expect(component.effectivePeriodRequired).toBeFalse();
    });
  });

  // ─── terminationPeriodRequired ───────────────────────────────────────────────

  describe('terminationPeriodRequired', () => {
    it('should be false initially', () => {
      expect(component.terminationPeriodRequired).toBeFalse();
    });

    it('should be true when termination date is set but period is not', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationPeriod: null });
      tick(0);
      component['validateTerminationPeriod']();
      expect(component.terminationPeriodRequired).toBeTrue();
    }));

    it('should be false when termination date and period are both set', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationPeriod: 'Before' });
      tick(0);
      component['validateTerminationPeriod']();
      expect(component.terminationPeriodRequired).toBeFalse();
    }));

    it('should be false when termination date is not set', () => {
      component.filterForm.patchValue({ terminationDate: null, terminationPeriod: null });
      component['validateTerminationPeriod']();
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });

  // ─── isApplyDisabled ─────────────────────────────────────────────────────────

  describe('isApplyDisabled', () => {


    it('should be false when type is selected', () => {
      component.filterForm.patchValue({ type: 'I' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be false when system is selected', () => {
      component.filterForm.patchValue({ system: 'Y' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be false when effective date is set', () => {
      component.filterForm.patchValue({
        effectiveDate: new Date(),
        effectivePeriod: 'After'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should be false when termination date is set', () => {
      component.filterForm.patchValue({
        terminationDate: new Date(),
        terminationPeriod: 'Before'
      });
      expect(component.isApplyDisabled).toBeFalse();
    });



    it('should be true when effective period is required but missing', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date(), effectivePeriod: null });
      tick(0);
      component['validateEffectivePeriod']();
      expect(component.isApplyDisabled).toBeTrue();
    }));

    it('should be true when termination period is required but missing', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date(), terminationPeriod: null });
      tick(0);
      component['validateTerminationPeriod']();
      expect(component.isApplyDisabled).toBeTrue();
    }));
  });

  // ─── apply() ─────────────────────────────────────────────────────────────────

  describe('apply()', () => {










    it('should call validateEffectivePeriod and validateTerminationPeriod before closing', () => {
      spyOn<any>(component, 'validateEffectivePeriod').and.callThrough();
      spyOn<any>(component, 'validateTerminationPeriod').and.callThrough();
      component.filterForm.patchValue({ type: 'N' });
      component.apply();
      expect(component['validateEffectivePeriod']).toHaveBeenCalled();
      expect(component['validateTerminationPeriod']).toHaveBeenCalled();
    });
  });

  // ─── clearAll() ──────────────────────────────────────────────────────────────

  describe('clearAll()', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        type: 'I',
        system: 'Y',
        effectivePeriod: 'After',
        effectiveDate: new Date(),
        terminationPeriod: 'Before',
        terminationDate: new Date()
      });
    });

    it('should reset type to null', () => {
      component.clearAll();
      expect(component.filterForm.get('type')?.value).toBeNull();
    });

    it('should reset system to null', () => {
      component.clearAll();
      expect(component.filterForm.get('system')?.value).toBeNull();
    });

    it('should reset effectivePeriod to null', () => {
      component.clearAll();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
    });

    it('should reset effectiveDate to null', () => {
      component.clearAll();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });

    it('should reset terminationPeriod to null', () => {
      component.clearAll();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
    });

    it('should reset terminationDate to null', () => {
      component.clearAll();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });


  });

  // ─── close() ─────────────────────────────────────────────────────────────────

  describe('close()', () => {
    it('should call dialogRef.close without arguments', () => {
      component.close();
      expect(dialogRefMock.close).toHaveBeenCalledWith();
    });
  });

  // ─── Date Input Handlers ──────────────────────────────────────────────────────

  describe('onEffectiveDateInput', () => {
    it('should mark effective date control as touched', () => {
      const mockEvent = { target: { value: '15-Mar-2026' } } as unknown as Event;
      const control = component.filterForm.get('effectiveDate')!;
      expect(control.touched).toBeFalse();
      component.onEffectiveDateInput(mockEvent);
      expect(control.touched).toBeTrue();
    });


  });

  describe('onTerminationDateInput', () => {
    it('should mark termination date control as touched', () => {
      const mockEvent = { target: { value: '30-Jun-2026' } } as unknown as Event;
      const control = component.filterForm.get('terminationDate')!;
      expect(control.touched).toBeFalse();
      component.onTerminationDateInput(mockEvent);
      expect(control.touched).toBeTrue();
    });
  });

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

// ─── Separate suite: pre-existing dialog data ────────────────────────────────
// This must be a top-level describe so it gets its own independent TestBed
// setup. Nesting it inside the main describe causes Angular to throw
// "Cannot configure the testing module after it has been instantiated".

describe('FilterInterdictionCodes — with pre-existing data', () => {
  let prePopComponent: FilterInterdictionCodes;
  let prePopFixture: ComponentFixture<FilterInterdictionCodes>;

  const prePopEffDate  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);  // 30 days ago
  const prePopTermDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);  // 90 days ahead

  const existingData: LabInterdictionFilterData = {
    type: 'I',
    system: 'Y',
    effectivePeriod: 'After',
    effectiveDate: prePopEffDate,
    terminationPeriod: 'Before',
    terminationDate: prePopTermDate
  };

  beforeEach(async () => {
    const ref = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [FilterInterdictionCodes],
      providers: [
        provideHttpClient(),
        { provide: MatDialogRef, useValue: ref },
        { provide: MAT_DIALOG_DATA, useValue: existingData }
      ]
    });

    prePopFixture = TestBed.createComponent(FilterInterdictionCodes);
    prePopComponent = prePopFixture.componentInstance;
    prePopFixture.detectChanges();
  });

  it('should pre-populate type from dialog data', () => {
    expect(prePopComponent.filterForm.get('type')?.value).toBe('I');
  });

  it('should pre-populate system from dialog data', () => {
    expect(prePopComponent.filterForm.get('system')?.value).toBe('Y');
  });

  it('should pre-populate effectivePeriod from dialog data', () => {
    expect(prePopComponent.filterForm.get('effectivePeriod')?.value).toBe('After');
  });

  it('should pre-populate terminationPeriod from dialog data', () => {
    expect(prePopComponent.filterForm.get('terminationPeriod')?.value).toBe('Before');
  });


});
