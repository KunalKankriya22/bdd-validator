import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ProcessStepsListComponent, ProcessStep } from './process-steps-list';

describe('ProcessStepsListComponent', () => {
  let component: ProcessStepsListComponent;
  let fixture: ComponentFixture<ProcessStepsListComponent>;

  const mockSteps: ProcessStep[] = [
    {
      id: '1', sequence: '1.00', name: 'BLOOD_TYPE',
      conditions: [
        { id: '1.01', sequence: '1.01', description: 'BLOOD_TYPE | DONOR_INFO / BLOOD_CD, EQUALS, A+' }
      ]
    },
    {
      id: '2', sequence: '2.00', name: 'WEIGHT',
      conditions: []
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessStepsListComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ProcessStepsListComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessStepsListComponent);
    component = fixture.componentInstance;
    component.steps = mockSteps;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('onStepClick', () => {
    it('should emit stepSelect', () => {
      const spy = spyOn(component.stepSelect, 'emit');
      component.onStepClick(mockSteps[0]);
      expect(spy).toHaveBeenCalledWith(mockSteps[0]);
    });
  });

  describe('onAddNewStep', () => {
    it('should emit addNewStep', () => {
      const spy = spyOn(component.addNewStep, 'emit');
      component.onAddNewStep();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('isSelected', () => {
    it('should return true when step id matches selectedStepId', () => {
      component.selectedStepId = '1';
      expect(component.isSelected(mockSteps[0])).toBe(true);
    });

    it('should return false when step id does not match', () => {
      component.selectedStepId = '2';
      expect(component.isSelected(mockSteps[0])).toBe(false);
    });

    it('should return false when selectedStepId is null', () => {
      component.selectedStepId = null;
      expect(component.isSelected(mockSteps[0])).toBe(false);
    });
  });

  describe('getDisplayDescription', () => {
    it('should strip lookingFor part before pipe', () => {
      const result = component.getDisplayDescription('BLOOD_TYPE | DONOR_INFO / BLOOD_CD, EQUALS, A+');
      expect(result).toBe('DONOR_INFO / BLOOD_CD, EQUALS, A+');
    });

    it('should return full description when no pipe', () => {
      const result = component.getDisplayDescription('DONOR_INFO / BLOOD_CD');
      expect(result).toBe('DONOR_INFO / BLOOD_CD');
    });
  });

  describe('empty state', () => {
    it('should handle empty steps array', () => {
      component.steps = [];
      expect(component.steps.length).toBe(0);
    });
  });
});
