import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';
import { AddEditAlternateId } from './add-edit-alternate-id';
import { AlternateIdService } from '../services/alternate-id.service';
import { AlternateIdDonorGrade } from '../models/alternate-id.model';
import { HeaderService } from '@shared/services/header.service';
import { TranslateModule } from '@ngx-translate/core';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditAlternateId', () => {
  let component: AddEditAlternateId;
  let fixture: ComponentFixture<AddEditAlternateId>;
  let mockService: jasmine.SpyObj<AlternateIdService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockEditData: AlternateIdDonorGrade = {
    keyDataGrade: '3',
    altidMatchType: 'DIFF',
    finalGrade: '5',
    effDate: new Date('2028-06-15'),
    termDate: new Date('2028-12-31'),
    programId: 'VDIALTID',
    insertDate: new Date('2028-06-01'),
    insertUser: 'ADMIN',
    auditKey: 42,
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AlternateIdService', ['create', 'update']);
    mockSnackBar = createMockMatSnackBar();

    const mockHeaderService = {
      chapterTimeZone: signal('America/New_York'),
      chapterId: signal(1),
    };

      TestBed.configureTestingModule({
      imports: [AddEditAlternateId, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: AlternateIdService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    });

    

      mockService.create.calls.reset();

      mockService.update.calls.reset();

    fixture = TestBed.createComponent(AddEditAlternateId);
    component = fixture.componentInstance;

    });

  describe('add mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have empty form in add mode', () => {
      expect(component.form.get('keyDataGrade')?.value).toBeFalsy();
      expect(component.form.get('altidMatchType')?.value).toBeFalsy();
      expect(component.form.get('finalGrade')?.value).toBeFalsy();
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should have all fields enabled', () => {
      expect(component.form.get('keyDataGrade')?.enabled).toBeTrue();
      expect(component.form.get('altidMatchType')?.enabled).toBeTrue();
      expect(component.form.get('finalGrade')?.enabled).toBeTrue();
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should display effective date in edit mode', () => {
      const display = component.getEffectiveDateDisplay();
      expect(display).not.toBe('-');
      expect(display).toContain('2028');
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require key grade', () => {
      expect(component.form.get('keyDataGrade')?.hasError('required')).toBeTrue();
    });

    it('should require alt ID match', () => {
      expect(component.form.get('altidMatchType')?.hasError('required')).toBeTrue();
    });

    it('should require final grade', () => {
      expect(component.form.get('finalGrade')?.hasError('required')).toBeTrue();
    });

    it('should require effective date', () => {
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should not require termination date', () => {
      component.form.patchValue({
        keyDataGrade: '1', altidMatchType: 'DIFF', finalGrade: '2',
        effDate: moment().add(30, 'days').startOf('day')
      });
      expect(component.form.valid).toBeTrue();
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    function fillValidForm(): void {
      const futureDate = moment().add(30, 'days').startOf('day');
      component.form.get('keyDataGrade')?.setValue('1');
      component.form.get('altidMatchType')?.setValue('DIFF');
      component.form.get('finalGrade')?.setValue('2');
      component.form.get('effDate')?.clearValidators();
      component.form.get('effDate')?.setValidators(Validators.required);
      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('effDate')?.updateValueAndValidity();
      component.form.clearValidators();
      component.form.updateValueAndValidity();
    }

    it('should call update in edit mode', fakeAsync(() => {
      mockService.update.and.returnValue(of({} as any));
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      component.form.patchValue({ finalGrade: '9' });
      component.form.markAsDirty();
      component.form.get('effDate')?.clearValidators();
      component.form.get('effDate')?.updateValueAndValidity();
      component.form.updateValueAndValidity();
      component.onSave();
      tick();
      expect(mockService.update).toHaveBeenCalledWith(42, jasmine.any(Object));
    }));

    it('should set savingAction to save and reset after completion', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      mockService.create.and.returnValue(saveSubject.asObservable());
      fillValidForm();
      component.onSave();
      expect(component.savingAction).toBe('save');
      expect(component.isSaving).toBe(true);
      saveSubject.next({});
      saveSubject.complete();
      tick();
      expect(component.savingAction).toBeNull();
      expect(component.isSaving).toBe(false);
    }));
  });

  describe('onSaveAndCreateAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    function fillValidFormForCreate(): void {
      const futureDate = moment().add(30, 'days').startOf('day');
      component.form.get('keyDataGrade')?.setValue('1');
      component.form.get('altidMatchType')?.setValue('DIFF');
      component.form.get('finalGrade')?.setValue('2');
      component.form.get('effDate')?.setValue(futureDate);
      component.form.get('effDate')?.clearValidators();
      component.form.get('effDate')?.setValidators(Validators.required);
      component.form.get('effDate')?.updateValueAndValidity();
      component.form.updateValueAndValidity();
    }

    it('should set savingAction to createAnother and reset after completion', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      mockService.create.and.returnValue(saveSubject.asObservable());
      fillValidFormForCreate();
      component.onSaveAndCreateAnother();
      expect(component.savingAction).toBe('createAnother');
      expect(component.isSaving).toBe(true);
      saveSubject.next({});
      saveSubject.complete();
      tick();
      expect(component.savingAction).toBeNull();
      expect(component.isSaving).toBe(false);
    }));

    it('should reset form after successful save', fakeAsync(() => {
      mockService.create.and.returnValue(of({} as any));
      fillValidFormForCreate();
      component.onSaveAndCreateAnother();
      tick();
      expect(component.form.get('keyDataGrade')?.value).toBeFalsy();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));

    it('should reset savingAction on API error', fakeAsync(() => {
      mockService.create.and.returnValue(throwError(() => new Error('fail')));
      fillValidFormForCreate();
      component.onSaveAndCreateAnother();
      tick();
      expect(component.isSaving).toBe(false);
      expect(component.savingAction).toBeNull();
    }));
  });
  describe('termMinDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return minDate when effective date is not set', () => {
      expect(component.termMinDate.isSame(component.minDate)).toBeTrue();
    });

    it('should return effective date when it is after chapter min date', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      expect(component.termMinDate.isSame(futureDate)).toBeTrue();
    });

    it('should return chapter min date when effective date is before it', () => {
      const pastDate = moment('2020-01-01');
      component.form.get('effDate')?.setValue(pastDate);
      expect(component.termMinDate.isSame(component.minDate)).toBeTrue();
    });

    it('should return minDate when effective date is invalid', () => {
      component.form.get('effDate')?.setValue('invalid');
      expect(component.termMinDate.isSame(component.minDate)).toBeTrue();
    });
  });

  describe('searchable dropdowns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty when search matches nothing', () => {
      component.keyGradeSearchCtrl.setValue('xyz');
      expect(component.filteredKeyGrades().length).toBe(0);
    });

    it('should not clear search on dropdown open', () => {
      component.keyGradeSearchCtrl.setValue('5');
      component.onSelectOpenedChange(component.keyGradeSearchCtrl, true);
      expect(component.keyGradeSearchCtrl.value).toBe('5');
    });
  });

  describe('display getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display selected key grade label', () => {
      component.form.get('keyDataGrade')?.setValue('5');
      expect(component.selectedKeyGradeDisplay).toBe('5');
    });

    it('should display selected final grade label', () => {
      component.form.get('finalGrade')?.setValue('7');
      expect(component.selectedFinalGradeDisplay).toBe('7');
    });

    it('should return value when option not found in list', () => {
      component.form.get('keyDataGrade')?.setValue('X');
      expect(component.selectedKeyGradeDisplay).toBe('X');
    });
  });

  describe('effective date display', () => {
    it('should format date properly', () => {
      fixture.detectChanges();
      component.form.get('effDate')?.setValue(moment('2028-03-15'));
      const display = component.getEffectiveDateDisplay();
      expect(display).toBe('15-MAR-2028');
    });
  });
});
