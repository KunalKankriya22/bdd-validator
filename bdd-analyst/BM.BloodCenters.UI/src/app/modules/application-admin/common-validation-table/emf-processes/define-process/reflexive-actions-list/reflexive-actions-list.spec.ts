import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ReflexiveActionsListComponent, ReflexiveAction } from './reflexive-actions-list';

describe('ReflexiveActionsListComponent', () => {
  let component: ReflexiveActionsListComponent;
  let fixture: ComponentFixture<ReflexiveActionsListComponent>;

  const mockActions: ReflexiveAction[] = [
    { id: '1', code: '1', name: 'INSERT', actionOn: 'DONOR', actionValue: 'Y', badge: 'F1' },
    { id: '2', code: '2', name: 'UPDATE', actionOn: 'PATIENT', actionValue: 'N' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReflexiveActionsListComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ReflexiveActionsListComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReflexiveActionsListComponent);
    component = fixture.componentInstance;
    component.actions = mockActions;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  describe('onActionClick', () => {
    it('should emit actionSelect', () => {
      const spy = spyOn(component.actionSelect, 'emit');
      component.onActionClick(mockActions[0]);
      expect(spy).toHaveBeenCalledWith(mockActions[0]);
    });
  });

  describe('onAddNewAction', () => {
    it('should emit addNewAction', () => {
      const spy = spyOn(component.addNewAction, 'emit');
      component.onAddNewAction();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('isSelected', () => {
    it('should return true when action id matches selectedActionId', () => {
      component.selectedActionId = '1';
      expect(component.isSelected(mockActions[0])).toBe(true);
    });

    it('should return false when action id does not match', () => {
      component.selectedActionId = '2';
      expect(component.isSelected(mockActions[0])).toBe(false);
    });

    it('should return false when selectedActionId is null', () => {
      component.selectedActionId = null;
      expect(component.isSelected(mockActions[0])).toBe(false);
    });
  });

  describe('empty state', () => {
    it('should handle empty actions array', () => {
      component.actions = [];
      expect(component.actions.length).toBe(0);
    });
  });
});
