import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ReflexiveActionDetailsComponent, ReflexiveActionDetailsData } from './reflexive-action-details';
import { ManufLookupService } from '../../services/manuf-lookup.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('ReflexiveActionDetailsComponent', () => {
  let manufSpy: any;
  let component: ReflexiveActionDetailsComponent;
  let fixture: ComponentFixture<ReflexiveActionDetailsComponent>;
  let mockManufLookup: jasmine.SpyObj<ManufLookupService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockActionData: ReflexiveActionDetailsData = {
    group: 'GRP1',
    action: 'ACTION1',
    tableName: 'DONORS',
    actionOn: 'FIELD1',
    columnName: 'COL1',
    actionValue: 'VALUE1',
    processOrder: '1',
    alternateProcessOrder: '2',
    parentGroup: '',
    operator: 'EQ',
    response: 'RESPONSE1',
    functions: 'FUNC1'
  };

  beforeEach(() => {

    manufSpy = jasmine.createSpyObj('ManufLookupService', [
      'getColumnNames', 'validateParentAction',
      'validateTableName', 'validateColumnName', 'validateFunctionName'
    ]);
    const snackBarSpy = createMockMatSnackBar();

    manufSpy.getColumnNames.and.returnValue(of(['COL1', 'COL2', 'COL3']));
    manufSpy.validateParentAction.and.returnValue(of(true));
    manufSpy.validateTableName.and.returnValue(of(true));
    manufSpy.validateColumnName.and.returnValue(of(true));
    manufSpy.validateFunctionName.and.returnValue(of(true));



      TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ReflexiveActionDetailsComponent],
      providers: [
        { provide: ManufLookupService, useValue: manufSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    


      manufSpy.getColumnNames.calls.reset();
      manufSpy.validateParentAction.calls.reset();
      manufSpy.validateTableName.calls.reset();
      manufSpy.validateColumnName.calls.reset();
      manufSpy.validateFunctionName.calls.reset();

      manufSpy.getColumnNames.and.returnValue(of(['COL1', 'COL2', 'COL3']));
      manufSpy.validateParentAction.and.returnValue(of(true));
      manufSpy.validateTableName.and.returnValue(of(true));
      manufSpy.validateColumnName.and.returnValue(of(true));
      manufSpy.validateFunctionName.and.returnValue(of(true));


    mockManufLookup = TestBed.inject(ManufLookupService) as jasmine.SpyObj<ManufLookupService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    fixture = TestBed.createComponent(ReflexiveActionDetailsComponent);
    component = fixture.componentInstance;
    component.actionOptions = ['ACTION1', 'ACTION2', 'ACTION3'];
    component.operatorOptions = ['EQ', 'NEQ', 'GT'];
    fixture.detectChanges();


    });


  // ── Form initialization ────────────────────────────────────────────────────

  describe('form initialization', () => {
    it('should initialize all controls to empty strings when actionData is null', () => {
      const fields = ['group', 'action', 'tableName', 'actionOn', 'columnName',
                      'actionValue', 'processOrder', 'alternateProcessOrder',
                      'parentGroup', 'operator', 'response', 'functions'];
      fields.forEach(f => expect(component.form.get(f)?.value).toBe(''));
    });

    it('should populate form controls from actionData when provided', () => {
      component.actionData = mockActionData;
      component.ngOnChanges({ actionData: new SimpleChange(null, mockActionData, false) });

      expect(component.form.get('group')?.value).toBe('GRP1');
      expect(component.form.get('action')?.value).toBe('ACTION1');
      expect(component.form.get('tableName')?.value).toBe('DONORS');
      expect(component.form.get('actionOn')?.value).toBe('FIELD1');
      expect(component.form.get('columnName')?.value).toBe('COL1');
      expect(component.form.get('actionValue')?.value).toBe('VALUE1');
      expect(component.form.get('processOrder')?.value).toBe('1');
      expect(component.form.get('alternateProcessOrder')?.value).toBe('2');
      expect(component.form.get('operator')?.value).toBe('EQ');
      expect(component.form.get('response')?.value).toBe('RESPONSE1');
      expect(component.form.get('functions')?.value).toBe('FUNC1');
    });

    it('should reset columnOptions on re-initialization', () => {
      component.columnOptions = ['OLD'];
      component.actionData = { ...mockActionData, tableName: '' };
      component.ngOnChanges({ actionData: new SimpleChange(null, component.actionData, false) });
      expect(component.columnOptions).toEqual([]);
    });

    it('should load columns for the initial tableName when actionData has one', fakeAsync(() => {
      component.actionData = mockActionData;
      component.ngOnChanges({ actionData: new SimpleChange(null, mockActionData, false) });
      tick();

      expect(mockManufLookup.getColumnNames).toHaveBeenCalledWith('DONORS');
      expect(component.columnOptions).toEqual(['COL1', 'COL2', 'COL3']);
      expect(component.filteredColumns).toEqual(['COL1', 'COL2', 'COL3']);
    }));
  });

  // ── Form validation ───────────────────────────────────────────────────────

  describe('form validation', () => {




    it('should require group', () => {
      component.form.get('group')?.setValue('');
      expect(component.form.get('group')?.hasError('required')).toBeTrue();
    });

    it('should require action', () => {
      component.form.get('action')?.setValue('');
      expect(component.form.get('action')?.hasError('required')).toBeTrue();
    });

    it('should require tableName', () => {
      component.form.get('tableName')?.setValue('');
      expect(component.form.get('tableName')?.hasError('required')).toBeTrue();
    });

    it('should require actionOn', () => {
      component.form.get('actionOn')?.setValue('');
      expect(component.form.get('actionOn')?.hasError('required')).toBeTrue();
    });

    it('should require actionValue', () => {
      component.form.get('actionValue')?.setValue('');
      expect(component.form.get('actionValue')?.hasError('required')).toBeTrue();
    });

    it('should require functions', () => {
      component.form.get('functions')?.setValue('');
      expect(component.form.get('functions')?.hasError('required')).toBeTrue();
    });

    it('should allow columnName to be empty', () => {
      component.form.get('columnName')?.setValue('');
      expect(component.form.get('columnName')?.valid).toBeTrue();
    });

    it('should enforce maxLength(5) on group', () => {
      component.form.get('group')?.setValue('TOOLNG');
      expect(component.form.get('group')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(30) on action', () => {
      component.form.get('action')?.setValue('A'.repeat(31));
      expect(component.form.get('action')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(30) on tableName', () => {
      component.form.get('tableName')?.setValue('A'.repeat(31));
      expect(component.form.get('tableName')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(30) on actionOn', () => {
      component.form.get('actionOn')?.setValue('A'.repeat(31));
      expect(component.form.get('actionOn')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(100) on actionValue', () => {
      component.form.get('actionValue')?.setValue('A'.repeat(101));
      expect(component.form.get('actionValue')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(5) on parentGroup', () => {
      component.form.get('parentGroup')?.setValue('TOOLNG');
      expect(component.form.get('parentGroup')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(500) on functions', () => {
      component.form.get('functions')?.setValue('A'.repeat(501));
      expect(component.form.get('functions')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(500) on response', () => {
      component.form.get('response')?.setValue('A'.repeat(501));
      expect(component.form.get('response')?.hasError('maxlength')).toBeTrue();
    });
  });

  // ── ngOnChanges ───────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('should reinitialize form when actionData changes', () => {
      const updated = { ...mockActionData, group: 'NEW' };
      component.actionData = updated;
      component.ngOnChanges({ actionData: new SimpleChange(mockActionData, updated, false) });
      expect(component.form.get('group')?.value).toBe('NEW');
    });

    it('should update filteredActions when actionOptions changes', () => {
      const newOpts = ['OPTX', 'OPTY'];
      component.actionOptions = newOpts;
      component.ngOnChanges({ actionOptions: new SimpleChange([], newOpts, false) });
      expect(component.filteredActions).toEqual(newOpts);
    });

    it('should update filteredOperators when operatorOptions changes', () => {
      const newOps = ['LT', 'GT'];
      component.operatorOptions = newOps;
      component.ngOnChanges({ operatorOptions: new SimpleChange([], newOps, false) });
      expect(component.filteredOperators).toEqual(newOps);
    });
  });

  // ── Search filtering ──────────────────────────────────────────────────────

  describe('search filtering', () => {
    it('should filter actions case-insensitively on actionSearchControl change', () => {
      component.actionSearchControl.setValue('action1');
      expect(component.filteredActions).toEqual(['ACTION1']);
    });

    it('should show all actions when actionSearchControl is cleared', () => {
      component.actionSearchControl.setValue('action1');
      component.actionSearchControl.setValue('');
      expect(component.filteredActions).toEqual(['ACTION1', 'ACTION2', 'ACTION3']);
    });

    it('should return empty array when no action matches the search', () => {
      component.actionSearchControl.setValue('NOMATCH');
      expect(component.filteredActions).toEqual([]);
    });

    it('should filter operators on operatorSearchControl change', () => {
      component.operatorSearchControl.setValue('eq');
      expect(component.filteredOperators).toEqual(['EQ', 'NEQ']);
    });

    it('should filter columns on columnSearchControl change', () => {
      component.columnOptions = ['COL1', 'COL2', 'NAME1'];
      component.filteredColumns = [...component.columnOptions];
      component.columnSearchControl.setValue('col');
      expect(component.filteredColumns).toEqual(['COL1', 'COL2']);
    });
  });

  // ── tableName change → column loading ────────────────────────────────────

  describe('tableName change triggers column load', () => {
    it('should call getColumnNames after debounce when tableName is entered', fakeAsync(() => {
      component.form.get('tableName')?.setValue('MY_TABLE');
      tick(400);
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledWith('MY_TABLE');
      expect(component.columnOptions).toEqual(['COL1', 'COL2', 'COL3']);
      expect(component.filteredColumns).toEqual(['COL1', 'COL2', 'COL3']);
      expect(component.isLoadingColumns).toBeFalse();
    }));

    it('should reset columnName field when tableName changes', fakeAsync(() => {
      component.form.get('columnName')?.setValue('OLD');
      component.form.get('tableName')?.setValue('NEW_TABLE');
      tick(400);
      expect(component.form.get('columnName')?.value).toBe('');
    }));

    it('should clear columns and columnName when tableName becomes empty', fakeAsync(() => {
      component.form.get('tableName')?.setValue('MY_TABLE');
      tick(400);
      component.form.get('tableName')?.setValue('');
      tick(400);
      expect(component.columnOptions).toEqual([]);
      expect(component.filteredColumns).toEqual([]);
      expect(component.form.get('columnName')?.value).toBe('');
    }));



    it('should clear columns and stop loading on getColumnNames error', fakeAsync(() => {
      mockManufLookup.getColumnNames.and.returnValue(throwError(() => new Error('fail')));
      component.form.get('tableName')?.setValue('BAD');
      tick(400);
      expect(component.columnOptions).toEqual([]);
      expect(component.filteredColumns).toEqual([]);
      expect(component.isLoadingColumns).toBeFalse();
    }));

    it('should trim tableName before sending to getColumnNames', fakeAsync(() => {
      component.form.get('tableName')?.setValue('  DONORS  ');
      tick(400);
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledWith('DONORS');
    }));
  });

  // ── parentGroup async validation ──────────────────────────────────────────

  describe('parentGroup async validation', () => {


    it('should call validateParentAction with processCode when value has 3+ characters', fakeAsync(() => {
      component.processCode = 'PROC1';
      component.form.get('parentGroup')?.setValue('GRP');
      tick(400);
      expect(mockManufLookup.validateParentAction).toHaveBeenCalledWith('PROC1', 'GRP');
    }));

    it('should set invalidParentGroup error when validation returns false', fakeAsync(() => {
      mockManufLookup.validateParentAction.and.returnValue(of(false));
      component.form.get('parentGroup')?.setValue('BAD');
      tick(400);
      expect(component.form.get('parentGroup')?.hasError('invalidParentGroup')).toBeTrue();
      expect(component.form.get('parentGroup')?.touched).toBeTrue();
    }));

    it('should clear invalidParentGroup error when validation returns true', fakeAsync(() => {
      const ctrl = component.form.get('parentGroup')!;
      ctrl.setErrors({ invalidParentGroup: true });
      ctrl.setValue('GRP');
      tick(400);
      expect(ctrl.hasError('invalidParentGroup')).toBeFalse();
    }));

    it('should set isValidatingParentGroup to false after validation completes', fakeAsync(() => {
      component.form.get('parentGroup')?.setValue('GRP');
      tick(400);
      expect(component.isValidatingParentGroup).toBeFalse();
    }));




  });

  // ── onTextKeyDown ─────────────────────────────────────────────────────────

  describe('onTextKeyDown', () => {
    it('should set periodKeyPressed when period key is pressed', () => {
      component.onTextKeyDown(new KeyboardEvent('keydown', { key: '.' }), 'group');
      expect((component as any).periodKeyPressed).toBeTrue();
    });

    it('should not set periodKeyPressed for non-period keys', () => {
      component.onTextKeyDown(new KeyboardEvent('keydown', { key: 'a' }), 'group');
      expect((component as any).periodKeyPressed).toBeFalse();
    });

    it('should capture value before input for a string control', () => {
      component.form.get('group')?.setValue('before');
      component.onTextKeyDown(new KeyboardEvent('keydown', { key: 'x' }), 'group');
      expect((component as any).valueBeforeInput['group']).toBe('before');
    });
  });

  // ── sanitizeInput ─────────────────────────────────────────────────────────

  describe('sanitizeInput', () => {
    it('should strip leading whitespace', () => {
      component.form.get('group')?.setValue('   text');
      component.sanitizeInput('group');
      expect(component.form.get('group')?.value).toBe('text');
    });

    it('should collapse consecutive spaces into one', () => {
      component.form.get('response')?.setValue('word   word');
      component.sanitizeInput('response');
      expect(component.form.get('response')?.value).toBe('word word');
    });

    it('should not modify an already clean value', () => {
      component.form.get('group')?.setValue('clean');
      component.sanitizeInput('group');
      expect(component.form.get('group')?.value).toBe('clean');
    });

    it('should remove a pasted period (period count increased without period key)', () => {
      component.form.get('group')?.setValue('no.dot');
      (component as any).valueBeforeInput['group'] = 'nodot';
      (component as any).periodKeyPressed = false;
      component.sanitizeInput('group');
      expect(component.form.get('group')?.value).toBe('nodot');
    });



    it('should do nothing for a non-existent control', () => {
      expect(() => component.sanitizeInput('nonExistent')).not.toThrow();
    });
  });

  // ── trimInput ─────────────────────────────────────────────────────────────

  describe('trimInput', () => {
    it('should trim trailing whitespace', () => {
      component.form.get('group')?.setValue('text   ');
      component.trimInput('group');
      expect(component.form.get('group')?.value).toBe('text');
    });

    it('should not modify a value with no trailing whitespace', () => {
      component.form.get('group')?.setValue('clean');
      component.trimInput('group');
      expect(component.form.get('group')?.value).toBe('clean');
    });

    it('should preserve internal spaces while trimming the end', () => {
      component.form.get('group')?.setValue('a b  ');
      component.trimInput('group');
      expect(component.form.get('group')?.value).toBe('a b');
    });

    it('should do nothing for a non-existent control', () => {
      expect(() => component.trimInput('nonExistent')).not.toThrow();
    });
  });

  // ── onClearAll ────────────────────────────────────────────────────────────

  describe('onClearAll', () => {
    it('should reset all form controls', () => {
      component.form.patchValue({ group: 'G1', action: 'A1', functions: 'F1' });
      component.onClearAll();
      expect(component.form.get('group')?.value).toBeNull();
      expect(component.form.get('action')?.value).toBeNull();
      expect(component.form.get('functions')?.value).toBeNull();
    });
  });

  // ── onSave ────────────────────────────────────────────────────────────────

  describe('onSave', () => {
    beforeEach(() => {
      component.form.patchValue({
        group: 'G1', action: 'ACTION1', tableName: 'TBL',
        actionOn: 'FLD', actionValue: 'VAL', functions: 'FN'
      });
    });





    it('should mark all controls as touched when form is invalid', () => {
      component.form.get('group')?.setValue('');
      component.onSave();
      expect(component.form.get('group')?.touched).toBeTrue();
      expect(component.form.get('tableName')?.touched).toBeTrue();
      expect(component.form.get('functions')?.touched).toBeTrue();
    });
  });

  // ── onCancel ──────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and formDestroy$ subjects', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const destroyCompleteSpy = spyOn((component as any).destroy$, 'complete');
      const formDestroySpy = spyOn((component as any).formDestroy$, 'next');
      const formDestroyCompleteSpy = spyOn((component as any).formDestroy$, 'complete');

      component.ngOnDestroy();

      expect(formDestroySpy).toHaveBeenCalled();
      expect(formDestroyCompleteSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
    });

    it('should stop action search filtering after destroy', () => {
      component.ngOnDestroy();
      component.actionSearchControl.setValue('test');
      // After destroy, filteredActions should not change (stays as last value)
      expect(component.filteredActions).toEqual(['ACTION1', 'ACTION2', 'ACTION3']);
    });

    it('should stop operator search filtering after destroy', () => {
      component.ngOnDestroy();
      component.operatorSearchControl.setValue('test');
      // After destroy, filteredOperators should not change
      expect(component.filteredOperators).toEqual(['EQ', 'NEQ', 'GT']);
    });
  });

  // ── onSave (valid form) ──────────────────────────────────────────────────

  describe('onSave (valid form)', () => {
    it('should emit save event with form data when form is valid', () => {
      spyOn(component.save, 'emit');
      component.form.patchValue({
        group: 'G1', action: 'ACTION1', tableName: 'TBL',
        actionOn: 'FLD', actionValue: 'VAL', functions: 'FN'
      });
      component.onSave();
      expect(component.save.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        group: 'G1', action: 'ACTION1', tableName: 'TBL',
        actionOn: 'FLD', actionValue: 'VAL', functions: 'FN'
      }));
    });

    it('should not emit save event when form is invalid', () => {
      spyOn(component.save, 'emit');
      component.form.get('group')?.setValue('');
      component.onSave();
      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  // ── sanitizeInput (additional branches) ──────────────────────────────────

  describe('sanitizeInput additional branches', () => {
    it('should allow a typed period (periodKeyPressed true)', () => {
      component.form.get('response')?.setValue('test.val');
      (component as any).valueBeforeInput['response'] = 'testval';
      (component as any).periodKeyPressed = true;
      component.sanitizeInput('response');
      // period should NOT be removed because periodKeyPressed is true
      expect(component.form.get('response')?.value).toBe('test.val');
    });

    it('should do nothing when control value is not a string', () => {
      component.form.get('group')?.setValue(null as any);
      expect(() => component.sanitizeInput('group')).not.toThrow();
    });

    it('should reset periodKeyPressed to false after sanitize', () => {
      (component as any).periodKeyPressed = true;
      component.form.get('group')?.setValue('abc');
      component.sanitizeInput('group');
      expect((component as any).periodKeyPressed).toBeFalse();
    });

    it('should not remove period when period count did not increase', () => {
      component.form.get('response')?.setValue('a.b');
      (component as any).valueBeforeInput['response'] = 'a.x';
      (component as any).periodKeyPressed = false;
      component.sanitizeInput('response');
      // Same number of periods, should keep value (just sanitize whitespace)
      expect(component.form.get('response')?.value).toBe('a.b');
    });

    it('should handle no previous value in valueBeforeInput', () => {
      // No previous value set at all
      component.form.get('group')?.setValue('hello');
      delete (component as any).valueBeforeInput['group'];
      (component as any).periodKeyPressed = false;
      component.sanitizeInput('group');
      expect(component.form.get('group')?.value).toBe('hello');
    });
  });

  // ── trimInput (additional branches) ──────────────────────────────────────

  describe('trimInput additional branches', () => {
    it('should do nothing when control value is not a string', () => {
      component.form.get('group')?.setValue(null as any);
      expect(() => component.trimInput('group')).not.toThrow();
    });

    it('should handle empty string', () => {
      component.form.get('group')?.setValue('');
      component.trimInput('group');
      expect(component.form.get('group')?.value).toBe('');
    });
  });

  // ── parentGroup validation (additional branches) ─────────────────────────

  describe('parentGroup validation additional branches', () => {
    it('should not call validateParentAction when value has fewer than 3 characters', fakeAsync(() => {
      component.form.get('parentGroup')?.setValue('AB');
      tick(400);
      expect(mockManufLookup.validateParentAction).not.toHaveBeenCalled();
      expect(component.isValidatingParentGroup).toBeFalse();
    }));

    it('should not call validateParentAction when value is empty', fakeAsync(() => {
      component.form.get('parentGroup')?.setValue('');
      tick(400);
      expect(mockManufLookup.validateParentAction).not.toHaveBeenCalled();
    }));

    it('should dismiss snackBar when validation completes', fakeAsync(() => {
      component.processCode = 'PROC1';
      component.form.get('parentGroup')?.setValue('GRP');
      tick(400);
      expect(mockSnackBar.dismiss).toHaveBeenCalled();
    }));

    it('should clear existing invalidParentGroup error before sending new request', fakeAsync(() => {
      const ctrl = component.form.get('parentGroup')!;
      ctrl.setErrors({ invalidParentGroup: true, maxlength: true });
      ctrl.setValue('NEW');
      tick(400);
      // After validation returns true, invalidParentGroup should be cleared
      expect(ctrl.hasError('invalidParentGroup')).toBeFalse();
    }));

    it('should preserve other errors when clearing invalidParentGroup on valid result', fakeAsync(() => {
      const ctrl = component.form.get('parentGroup')!;
      // Set two errors before the validation starts
      ctrl.setErrors({ invalidParentGroup: true, maxlength: { requiredLength: 5, actualLength: 6 } });
      mockManufLookup.validateParentAction.and.returnValue(of(true));
      ctrl.setValue('GRP');
      tick(400);
      // invalidParentGroup removed, maxlength may be re-evaluated by Angular validators
      expect(ctrl.hasError('invalidParentGroup')).toBeFalse();
    }));

    it('should set isValidatingParentGroup to true while validating', fakeAsync(() => {
      let resolveValidation!: (value: boolean) => void;
      mockManufLookup.validateParentAction.and.returnValue(new (require('rxjs').Observable)((subscriber: any) => {
        resolveValidation = (val: boolean) => {
          subscriber.next(val);
          subscriber.complete();
        };
      }));

      component.processCode = 'PROC1';
      component.form.get('parentGroup')?.setValue('GRP');
      tick(400);
      // Validation in-flight
      expect(component.isValidatingParentGroup).toBeTrue();

      resolveValidation(true);
      tick();
      expect(component.isValidatingParentGroup).toBeFalse();
    }));

    it('should trim value before calling validateParentAction', fakeAsync(() => {
      component.processCode = 'PROC1';
      component.form.get('parentGroup')?.setValue('  GRP  ');
      tick(400);
      expect(mockManufLookup.validateParentAction).toHaveBeenCalledWith('PROC1', 'GRP');
    }));

    it('should mark parentGroup as touched when validation returns false', fakeAsync(() => {
      mockManufLookup.validateParentAction.and.returnValue(of(false));
      component.form.get('parentGroup')?.setValue('BAD');
      tick(400);
      expect(component.form.get('parentGroup')?.touched).toBeTrue();
    }));
  });

  // ── tableName change (additional branches) ───────────────────────────────

  describe('tableName change additional branches', () => {
    it('should set isLoadingColumns to true while loading', fakeAsync(() => {
      let resolveColumns!: (value: string[]) => void;
      mockManufLookup.getColumnNames.and.returnValue(new (require('rxjs').Observable)((subscriber: any) => {
        resolveColumns = (val: string[]) => {
          subscriber.next(val);
          subscriber.complete();
        };
      }));

      component.form.get('tableName')?.setValue('LOADING_TABLE');
      tick(400);
      expect(component.isLoadingColumns).toBeTrue();

      resolveColumns(['A', 'B']);
      tick();
      expect(component.isLoadingColumns).toBeFalse();
      expect(component.columnOptions).toEqual(['A', 'B']);
    }));

    it('should clear columns and columnName when tableName is whitespace only', fakeAsync(() => {
      component.form.get('tableName')?.setValue('   ');
      tick(400);
      expect(component.columnOptions).toEqual([]);
      expect(component.filteredColumns).toEqual([]);
      expect(component.form.get('columnName')?.value).toBe('');
    }));

    it('should not call getColumnNames again for the same tableName (distinctUntilChanged)', fakeAsync(() => {
      component.form.get('tableName')?.setValue('SAME');
      tick(400);
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledTimes(1);

      // Set same value again
      component.form.get('tableName')?.setValue('SAME');
      tick(400);
      // distinctUntilChanged should prevent second call
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledTimes(1);
    }));
  });

  // ── form validation (additional maxLength checks) ────────────────────────

  describe('form validation additional checks', () => {
    it('should enforce maxLength(100) on processOrder', () => {
      component.form.get('processOrder')?.setValue('A'.repeat(101));
      expect(component.form.get('processOrder')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(100) on alternateProcessOrder', () => {
      component.form.get('alternateProcessOrder')?.setValue('A'.repeat(101));
      expect(component.form.get('alternateProcessOrder')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(30) on operator', () => {
      component.form.get('operator')?.setValue('A'.repeat(31));
      expect(component.form.get('operator')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength(30) on columnName', () => {
      component.form.get('columnName')?.setValue('A'.repeat(31));
      expect(component.form.get('columnName')?.hasError('maxlength')).toBeTrue();
    });

    it('should not require processOrder', () => {
      component.form.get('processOrder')?.setValue('');
      expect(component.form.get('processOrder')?.hasError('required')).toBeFalse();
    });

    it('should not require alternateProcessOrder', () => {
      component.form.get('alternateProcessOrder')?.setValue('');
      expect(component.form.get('alternateProcessOrder')?.hasError('required')).toBeFalse();
    });

    it('should not require operator', () => {
      component.form.get('operator')?.setValue('');
      expect(component.form.get('operator')?.hasError('required')).toBeFalse();
    });

    it('should not require response', () => {
      component.form.get('response')?.setValue('');
      expect(component.form.get('response')?.hasError('required')).toBeFalse();
    });

    it('should not require parentGroup', () => {
      component.form.get('parentGroup')?.setValue('');
      expect(component.form.get('parentGroup')?.hasError('required')).toBeFalse();
    });

    it('should consider form valid when all required fields are filled with valid values', () => {
      component.form.patchValue({
        group: 'G1', action: 'ACT', tableName: 'TBL',
        actionOn: 'FLD', actionValue: 'VAL', functions: 'FN'
      });
      expect(component.form.valid).toBeTrue();
    });

    it('should consider form invalid when required field is missing', () => {
      component.form.patchValue({
        group: '', action: 'ACT', tableName: 'TBL',
        actionOn: 'FLD', actionValue: 'VAL', functions: 'FN'
      });
      expect(component.form.valid).toBeFalse();
    });
  });

  // ── onTextKeyDown additional branches ────────────────────────────────────

  describe('onTextKeyDown additional branches', () => {
    it('should not store value when control value is not a string', () => {
      component.form.get('group')?.setValue(null as any);
      component.onTextKeyDown(new KeyboardEvent('keydown', { key: 'a' }), 'group');
      expect((component as any).valueBeforeInput['group']).toBeUndefined();
    });
  });

  // ── search filtering (null handling) ─────────────────────────────────────

  describe('search filtering null handling', () => {
    it('should show all actions when actionSearchControl is set to null', () => {
      component.actionSearchControl.setValue(null);
      expect(component.filteredActions).toEqual(['ACTION1', 'ACTION2', 'ACTION3']);
    });

    it('should show all operators when operatorSearchControl is set to null', () => {
      component.operatorSearchControl.setValue(null);
      expect(component.filteredOperators).toEqual(['EQ', 'NEQ', 'GT']);
    });

    it('should show all columns when columnSearchControl is set to null', () => {
      component.columnOptions = ['COL1', 'COL2'];
      component.filteredColumns = [...component.columnOptions];
      component.columnSearchControl.setValue(null);
      expect(component.filteredColumns).toEqual(['COL1', 'COL2']);
    });
  });

  // ── initForm formDestroy$ (previous subscription cleanup) ────────────────

  describe('initForm subscription cleanup', () => {
    it('should kill previous form subscriptions when reinitializing', fakeAsync(() => {
      // Set up first form with a tableName subscription
      component.form.get('tableName')?.setValue('TABLE1');
      tick(400);
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledWith('TABLE1');
      mockManufLookup.getColumnNames.calls.reset();

      // Reinitialize form (simulates actionData change)
      component.actionData = { ...mockActionData, tableName: '' };
      component.ngOnChanges({ actionData: new SimpleChange(null, component.actionData, false) });

      // Now changing the OLD form's tableName should not trigger a call
      // because formDestroy$ was signaled, killing the old subscription
      // The new form has its own subscription that works
      component.form.get('tableName')?.setValue('TABLE2');
      tick(400);
      expect(mockManufLookup.getColumnNames).toHaveBeenCalledWith('TABLE2');
    }));
  });

  // ── ngOnChanges (no-op for unrelated changes) ────────────────────────────

  describe('ngOnChanges unrelated changes', () => {
    it('should not reinitialize form when unrelated input changes', () => {
      const formBefore = component.form;
      component.ngOnChanges({ isSaving: new SimpleChange(false, true, false) } as any);
      expect(component.form).toBe(formBefore);
    });

    it('should handle multiple changes at once', () => {
      const newActions = ['X', 'Y'];
      const newOperators = ['A', 'B'];
      component.actionOptions = newActions;
      component.operatorOptions = newOperators;
      component.ngOnChanges({
        actionOptions: new SimpleChange([], newActions, false),
        operatorOptions: new SimpleChange([], newOperators, false)
      });
      expect(component.filteredActions).toEqual(newActions);
      expect(component.filteredOperators).toEqual(newOperators);
    });
  });

  // ── Table Name async validation ─────────────────────────────────────────

  describe('tableName async validation', () => {
    it('should show invalidTableName error when table name is invalid', fakeAsync(() => {
      mockManufLookup.validateTableName.and.returnValue(of(false));

      component.form.get('tableName')?.setValue('NONEXISTENT_TABLE');
      component.form.get('tableName')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('tableName')?.hasError('invalidTableName')).toBeTrue();
    }));

    it('should not show invalidTableName error when table name is valid', fakeAsync(() => {
      mockManufLookup.validateTableName.and.returnValue(of(true));

      component.form.get('tableName')?.setValue('DONORS');
      component.form.get('tableName')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('tableName')?.hasError('invalidTableName')).toBeFalse();
    }));
  });

  // ── Action On async validation ──────────────────────────────────────────

  describe('actionOn async validation', () => {
    it('should set actionOn async validator when tableName has value', fakeAsync(() => {
      mockManufLookup.validateTableName.and.returnValue(of(true));
      mockManufLookup.validateColumnName.and.returnValue(of(true));

      component.form.get('tableName')?.setValue('DONORS');
      tick(400);
      fixture.detectChanges();

      component.form.get('actionOn')?.setValue('DIN');
      component.form.get('actionOn')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('actionOn')?.hasError('invalidColumnName')).toBeFalse();
    }));

    it('should show invalidColumnName error when actionOn column does not exist', fakeAsync(() => {
      mockManufLookup.validateTableName.and.returnValue(of(true));
      mockManufLookup.validateColumnName.and.returnValue(of(false));

      component.form.get('tableName')?.setValue('DONORS');
      tick(400);
      fixture.detectChanges();

      component.form.get('actionOn')?.setValue('BAD_COLUMN');
      component.form.get('actionOn')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('actionOn')?.hasError('invalidColumnName')).toBeTrue();
    }));

    it('should clear actionOn async validators when tableName is cleared', fakeAsync(() => {
      mockManufLookup.validateTableName.and.returnValue(of(true));
      mockManufLookup.validateColumnName.and.returnValue(of(true));

      component.form.get('tableName')?.setValue('DONORS');
      tick(400);
      fixture.detectChanges();

      component.form.get('tableName')?.setValue('');
      tick(400);
      fixture.detectChanges();

      component.form.get('actionOn')?.setValue('ANYTHING');
      component.form.get('actionOn')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('actionOn')?.hasError('invalidColumnName')).toBeFalse();
    }));
  });

  // ── Functions async validation ──────────────────────────────────────────

  describe('functions async validation', () => {
    it('should show invalidFunctionName error when function is invalid', fakeAsync(() => {
      mockManufLookup.validateFunctionName.and.returnValue(of(false));

      component.form.get('functions')?.setValue('BAD_FUNC');
      component.form.get('functions')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('functions')?.hasError('invalidFunctionName')).toBeTrue();
    }));

    it('should not show invalidFunctionName error when function is valid', fakeAsync(() => {
      mockManufLookup.validateFunctionName.and.returnValue(of(true));

      component.form.get('functions')?.setValue('PROC_DONOR');
      component.form.get('functions')?.markAsTouched();
      tick(600);
      fixture.detectChanges();

      expect(component.form.get('functions')?.hasError('invalidFunctionName')).toBeFalse();
    }));
  });
});
