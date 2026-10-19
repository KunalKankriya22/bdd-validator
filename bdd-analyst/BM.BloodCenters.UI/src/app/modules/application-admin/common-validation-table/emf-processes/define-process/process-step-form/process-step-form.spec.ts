import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { SimpleChange } from '@angular/core';

import { ProcessStepFormComponent, ProcessStepFormData, ConditionFormData } from './process-step-form';
import { MappingNameLookupDto } from '../../services/manuf-lookup.service';

describe('ProcessStepFormComponent', () => {
  let component: ProcessStepFormComponent;
  let fixture: ComponentFixture<ProcessStepFormComponent>;

  const mockMappingLookups: MappingNameLookupDto[] = [
    { mappingName: 'BLOOD_TYPE', dataTableName: 'DONOR_INFO', dataColumnName: 'BLOOD_TYPE_CD' },
    { mappingName: 'WEIGHT', dataTableName: 'DONOR_PHYS', dataColumnName: 'WEIGHT_KG' }
  ];

  const mockStepData: ProcessStepFormData = {
    stepName: 'BLOOD_TYPE',
    stepSequence: '1',
    conditions: [
      {
        lookingFor: 'BLOOD_TYPE',
        dataEntity: 'DONOR_INFO',
        dataSource: 'BLOOD_TYPE_CD',
        operator: 'EQUALS',
        response: 'A+'
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProcessStepFormComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        NgxMatSelectSearchModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessStepFormComponent);
    component = fixture.componentInstance;
    component.mappingLookups = mockMappingLookups;
    component.operatorOptions = ['OR', 'AND', 'NOT', 'EQUALS', 'IS', 'EQ'];
  });

  // ======================== Initialization ========================
  describe('Initialization', () => {
    it('should create component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should create form with stepName and conditions FormArray', () => {
      fixture.detectChanges();
      expect(component.form.get('stepName')).toBeTruthy();
      expect(component.conditions).toBeInstanceOf(FormArray);
    });

    it('should create one empty condition when stepData is null', () => {
      component.stepData = null;
      fixture.detectChanges();
      expect(component.conditions.length).toBe(1);
      expect(component.conditions.at(0).get('lookingFor')?.value).toBe('');
    });

    it('should populate conditions from stepData', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      expect(component.conditions.length).toBe(1);
      expect(component.conditions.at(0).get('lookingFor')?.value).toBe('BLOOD_TYPE');
      expect(component.conditions.at(0).get('dataEntity')?.value).toBe('DONOR_INFO');
      expect(component.conditions.at(0).get('dataSource')?.value).toBe('BLOOD_TYPE_CD');
      expect(component.conditions.at(0).get('operator')?.value).toBe('EQUALS');
      expect(component.conditions.at(0).get('response')?.value).toBe('A+');
    });

    it('should set lookingFor, dataEntity, dataSource as disabled', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      expect(condition.get('lookingFor')?.disabled).toBe(true);
      expect(condition.get('dataEntity')?.disabled).toBe(true);
      expect(condition.get('dataSource')?.disabled).toBe(true);
    });

    it('should initialize filteredOperators from operatorOptions', () => {
      fixture.detectChanges();
      expect(component.filteredOperators).toEqual(['OR', 'AND', 'NOT', 'EQUALS', 'IS', 'EQ']);
    });

    it('should set isFormDirty to false initially', () => {
      fixture.detectChanges();
      expect(component.isFormDirty).toBe(false);
    });
  });

  // ======================== ngOnChanges ========================
  describe('ngOnChanges', () => {
    it('should reinitialize form when stepData changes', () => {
      fixture.detectChanges();
      expect(component.conditions.length).toBe(1);
      expect(component.conditions.at(0).get('operator')?.value).toBe('');

      component.stepData = mockStepData;
      component.ngOnChanges({
        stepData: new SimpleChange(null, mockStepData, false)
      });
      expect(component.conditions.at(0).get('operator')?.value).toBe('EQUALS');
    });

    it('should update filteredOperators when operatorOptions changes', () => {
      fixture.detectChanges();
      const newOps = ['GT', 'LT'];
      component.operatorOptions = newOps;
      component.ngOnChanges({
        operatorOptions: new SimpleChange(['OR'], newOps, false)
      });
      expect(component.filteredOperators).toEqual(['GT', 'LT']);
    });
  });

  // ======================== operatorConditionalRequired ========================
  describe('operatorConditionalRequired validator', () => {
    it('should return required error when dataEntity and dataSource filled but operator empty', () => {
      component.stepData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1',
        conditions: [{
          lookingFor: 'BLOOD_TYPE', dataEntity: 'TABLE', dataSource: 'COLUMN',
          operator: '', response: 'test'
        }]
      };
      fixture.detectChanges();
      const operatorControl = component.conditions.at(0).get('operator');
      expect(operatorControl?.hasError('required')).toBe(true);
    });

    it('should return null when dataEntity is empty', () => {
      component.stepData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1',
        conditions: [{
          lookingFor: 'BLOOD_TYPE', dataEntity: '', dataSource: 'COLUMN',
          operator: '', response: 'test'
        }]
      };
      fixture.detectChanges();
      const operatorControl = component.conditions.at(0).get('operator');
      expect(operatorControl?.hasError('required')).toBe(false);
    });

    it('should return null when operator has value', () => {
      component.stepData = {
        stepName: 'BLOOD_TYPE',
        stepSequence: '1',
        conditions: [{
          lookingFor: 'BLOOD_TYPE', dataEntity: 'TABLE', dataSource: 'COLUMN',
          operator: 'EQUALS', response: 'test'
        }]
      };
      fixture.detectChanges();
      const operatorControl = component.conditions.at(0).get('operator');
      expect(operatorControl?.valid).toBe(true);
    });
  });

  // ======================== addCondition ========================
  describe('addCondition', () => {
    it('should add new condition to FormArray', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      expect(component.conditions.length).toBe(1);

      component.addCondition();
      expect(component.conditions.length).toBe(2);
    });

    it('should default lookingFor to stepData.stepName', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      component.addCondition();

      const newCondition = component.conditions.at(1);
      expect(newCondition.get('lookingFor')?.value).toBe('BLOOD_TYPE');
    });

    it('should auto-populate dataEntity and dataSource from mappingLookups', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      component.addCondition();

      const newCondition = component.conditions.at(1);
      expect(newCondition.get('dataEntity')?.value).toBe('DONOR_INFO');
      expect(newCondition.get('dataSource')?.value).toBe('BLOOD_TYPE_CD');
    });

    it('should set isFormDirty to true', () => {
      fixture.detectChanges();
      expect(component.isFormDirty).toBe(false);
      component.addCondition();
      expect(component.isFormDirty).toBe(true);
    });
  });

  // ======================== removeCondition ========================
  describe('removeCondition', () => {
    it('should remove condition at given index', () => {
      component.stepData = {
        stepName: 'TEST',
        stepSequence: '1',
        conditions: [
          { lookingFor: 'A', dataEntity: '', dataSource: '', operator: '', response: 'r1' },
          { lookingFor: 'B', dataEntity: '', dataSource: '', operator: '', response: 'r2' }
        ]
      };
      fixture.detectChanges();
      expect(component.conditions.length).toBe(2);

      component.removeCondition(0);
      expect(component.conditions.length).toBe(1);
      expect(component.conditions.at(0).get('response')?.value).toBe('r2');
    });

    it('should not remove when only one condition remains', () => {
      fixture.detectChanges();
      expect(component.conditions.length).toBe(1);
      component.removeCondition(0);
      expect(component.conditions.length).toBe(1);
    });
  });

  // ======================== onLookingForChange ========================
  describe('onLookingForChange', () => {
    it('should populate dataEntity and dataSource from matching mapping lookup', () => {
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('lookingFor')?.setValue('BLOOD_TYPE');

      component.onLookingForChange(0);

      expect(condition.get('dataEntity')?.value).toBe('DONOR_INFO');
      expect(condition.get('dataSource')?.value).toBe('BLOOD_TYPE_CD');
    });

    it('should clear dataEntity and dataSource when no selection', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('lookingFor')?.setValue('');

      component.onLookingForChange(0);

      expect(condition.get('dataEntity')?.value).toBe('');
      expect(condition.get('dataSource')?.value).toBe('');
    });

    it('should trigger operator revalidation', () => {
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      const operatorControl = condition.get('operator');
      const spy = spyOn(operatorControl!, 'updateValueAndValidity');

      component.onLookingForChange(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ======================== onClearAll ========================
  describe('onClearAll', () => {
    it('should reset operator and response for all conditions', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();

      component.onClearAll();

      const condition = component.conditions.at(0);
      expect(condition.get('operator')?.value).toBe('');
      expect(condition.get('response')?.value).toBe('');
    });

    it('should update isFormDirty', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      component.onClearAll();
      expect(component.isFormDirty).toBe(true);
    });
  });

  // ======================== onSave / onCancel ========================
  describe('onSave', () => {
    it('should emit form getRawValue when valid', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const spy = spyOn(component.save, 'emit');

      component.onSave();

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
        stepName: 'BLOOD_TYPE'
      }));
    });

    it('should call markAllAsTouched when invalid', () => {
      fixture.detectChanges();
      // Response is required, new empty condition has no response
      const condition = component.conditions.at(0);
      condition.get('response')?.setValue('');
      condition.get('response')?.markAsUntouched();

      const spy = spyOn(component.form, 'markAllAsTouched');
      component.onSave();
      expect(spy).toHaveBeenCalled();
    });

    it('should include disabled field values in emitted data', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const spy = spyOn(component.save, 'emit');

      component.onSave();

      const emitted = spy.calls.mostRecent().args[0];
      expect(emitted.conditions[0].lookingFor).toBe('BLOOD_TYPE');
      expect(emitted.conditions[0].dataEntity).toBe('DONOR_INFO');
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      fixture.detectChanges();
      const spy = spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ======================== isSaveDisabled ========================
  describe('isSaveDisabled', () => {
    it('should be true when form is invalid', () => {
      fixture.detectChanges();
      component.conditions.at(0).get('response')?.setValue('');
      expect(component.isSaveDisabled).toBe(true);
    });

    it('should be true when not dirty', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      expect(component.isFormDirty).toBe(false);
      expect(component.isSaveDisabled).toBe(true);
    });

    it('should be true when isSaving', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      component.isFormDirty = true;
      component.isSaving = true;
      expect(component.isSaveDisabled).toBe(true);
    });
  });

  // ======================== sanitizeInput ========================
  describe('sanitizeInput', () => {
    it('should remove leading spaces', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('response')?.setValue('  hello');

      component.sanitizeInput(0, 'response');
      expect(condition.get('response')?.value).toBe('hello');
    });

    it('should collapse multiple spaces to one', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('response')?.setValue('hello    world');

      component.sanitizeInput(0, 'response');
      expect(condition.get('response')?.value).toBe('hello world');
    });

    it('should handle non-existent control gracefully', () => {
      fixture.detectChanges();
      expect(() => component.sanitizeInput(0, 'nonexistent')).not.toThrow();
    });
  });

  // ======================== trimInput ========================
  describe('trimInput', () => {
    it('should trim trailing whitespace', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('response')?.setValue('hello   ');

      component.trimInput(0, 'response');
      expect(condition.get('response')?.value).toBe('hello');
    });

    it('should do nothing when no trailing whitespace', () => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      const condition = component.conditions.at(0);
      condition.get('response')?.setValue('hello');

      component.trimInput(0, 'response');
      expect(condition.get('response')?.value).toBe('hello');
    });
  });

  // ======================== getConditionSequence ========================
  describe('getConditionSequence', () => {
    it('should format as "Seq X.01"', () => {
      component.stepSequence = '3';
      fixture.detectChanges();
      expect(component.getConditionSequence(0)).toBe('Seq 3.01');
      expect(component.getConditionSequence(1)).toBe('Seq 3.02');
    });

    it('should handle decimal stepSequence', () => {
      component.stepSequence = '5.03';
      fixture.detectChanges();
      expect(component.getConditionSequence(0)).toBe('Seq 5.01');
    });

    it('should use 0 when stepSequence is empty', () => {
      component.stepSequence = '';
      fixture.detectChanges();
      expect(component.getConditionSequence(0)).toBe('Seq 0.01');
    });
  });

  // ======================== Dirty tracking ========================
  describe('dirty tracking', () => {
    it('should detect changes to response field', fakeAsync(() => {
      component.stepData = mockStepData;
      fixture.detectChanges();
      tick();

      expect(component.isFormDirty).toBe(false);

      component.conditions.at(0).get('response')?.setValue('CHANGED');
      tick();

      expect(component.isFormDirty).toBe(true);
    }));
  });

  // ======================== Operator search filtering ========================
  describe('operator search', () => {
    it('should filter operators by search term', fakeAsync(() => {
      fixture.detectChanges();
      component.operatorSearchControl.setValue('eq');
      tick();

      expect(component.filteredOperators).toContain('EQUALS');
      expect(component.filteredOperators).toContain('EQ');
      expect(component.filteredOperators).not.toContain('OR');
    }));

    it('should show all operators when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      component.operatorSearchControl.setValue('');
      tick();

      expect(component.filteredOperators.length).toBe(6);
    }));
  });
});
