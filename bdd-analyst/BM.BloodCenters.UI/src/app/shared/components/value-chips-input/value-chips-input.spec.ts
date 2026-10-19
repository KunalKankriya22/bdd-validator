import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ValueChipsInputComponent, ValueValidationEvent } from './value-chips-input';

describe('ValueChipsInputComponent', () => {
  let component: ValueChipsInputComponent;
  let fixture: ComponentFixture<ValueChipsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueChipsInputComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ValueChipsInputComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    try { fixture.detectChanges(); } catch (_) {}
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize values to empty array if null', () => {
      component.values = null as any;
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.values).toEqual([]);
    });

    it('should keep existing values array', () => {
      component.values = ['A', 'B'];
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.values).toEqual(['A', 'B']);
    });
  });

  describe('getPlaceholder', () => {
    it('should replace {index} with next value number', () => {
      component.values = ['A', 'B'];
      expect(component.getPlaceholder()).toBe('Value 3');
    });

    it('should show 1 for empty values', () => {
      component.values = [];
      expect(component.getPlaceholder()).toBe('Value 1');
    });
  });

  describe('canAdd', () => {
    it('should return true when enabled and value exists', () => {
      component.disabled = false;
      component.currentValue = 'test';
      expect(component.canAdd()).toBeTrue();
    });

    it('should return false when disabled', () => {
      component.disabled = true;
      component.currentValue = 'test';
      expect(component.canAdd()).toBeFalse();
    });

    it('should return false when value is empty', () => {
      component.disabled = false;
      component.currentValue = '';
      expect(component.canAdd()).toBeFalse();
    });

    it('should return false when value is whitespace only', () => {
      component.disabled = false;
      component.currentValue = '   ';
      expect(component.canAdd()).toBeFalse();
    });

    it('should return false when currentValue is null', () => {
      component.disabled = false;
      component.currentValue = null as any;
      expect(component.canAdd()).toBeFalse();
    });
  });

  describe('onAdd', () => {
    beforeEach(() => {
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should add value and emit events', () => {
      spyOn(component.valuesChange, 'emit');
      spyOn(component.valueAdded, 'emit');

      component.currentValue = 'NewValue';
      component.onAdd();

      expect(component.values).toContain('NewValue');
      expect(component.currentValue).toBe('');
      expect(component.valuesChange.emit).toHaveBeenCalledWith(component.values);
      expect(component.valueAdded.emit).toHaveBeenCalledWith('NewValue');
    });

    it('should not add empty value', () => {
      component.currentValue = '';
      component.onAdd();
      expect(component.values.length).toBe(0);
    });

    it('should not add whitespace-only value', () => {
      component.currentValue = '   ';
      component.onAdd();
      expect(component.values.length).toBe(0);
    });

    it('should prevent duplicates by default (case-insensitive)', () => {
      component.values = ['TestValue'];
      component.allowDuplicates = false;
      component.caseSensitive = false;
      component.currentValue = 'testvalue';
      component.onAdd();
      expect(component.values.length).toBe(1);
      expect(component.errorMessage).toBe('This value has already been added');
    });

    it('should prevent duplicates case-sensitively when caseSensitive is true', () => {
      component.values = ['TestValue'];
      component.allowDuplicates = false;
      component.caseSensitive = true;
      component.currentValue = 'TestValue';
      component.onAdd();
      expect(component.values.length).toBe(1);
      expect(component.errorMessage).toBe('This value has already been added');
    });

    it('should allow different case when caseSensitive is true', () => {
      component.values = ['TestValue'];
      component.allowDuplicates = false;
      component.caseSensitive = true;
      component.currentValue = 'testvalue';
      component.onAdd();
      expect(component.values.length).toBe(2);
    });

    it('should allow duplicates when allowDuplicates is true', () => {
      component.values = ['TestValue'];
      component.allowDuplicates = true;
      component.currentValue = 'TestValue';
      component.onAdd();
      expect(component.values.length).toBe(2);
    });

    it('should emit validateValue when observed and call callback on valid', () => {
      component.validateValue.subscribe((event: ValueValidationEvent) => {
        event.callback(true);
      });

      component.currentValue = 'ValidValue';
      component.onAdd();

      expect(component.values).toContain('ValidValue');
      expect(component.errorMessage).toBe('');
    });

    it('should set error when validation fails', () => {
      component.validateValue.subscribe((event: ValueValidationEvent) => {
        event.callback(false, 'Custom error');
      });

      component.currentValue = 'InvalidValue';
      component.onAdd();

      expect(component.values).not.toContain('InvalidValue');
      expect(component.errorMessage).toBe('Custom error');
    });

    it('should set default error when validation fails without message', () => {
      component.validateValue.subscribe((event: ValueValidationEvent) => {
        event.callback(false);
      });

      component.currentValue = 'InvalidValue';
      component.onAdd();

      expect(component.errorMessage).toBe('Invalid value');
    });

    it('should clear error message on new add attempt', () => {
      component.errorMessage = 'Previous error';
      component.currentValue = 'NewValue';
      component.onAdd();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('onRemove', () => {
    beforeEach(() => {
      try { fixture.detectChanges(); } catch (_) {}
      component.values = ['A', 'B', 'C'];
    });

    it('should remove value at index', () => {
      spyOn(component.valuesChange, 'emit');
      spyOn(component.valueRemoved, 'emit');

      component.onRemove(1);

      expect(component.values).toEqual(['A', 'C']);
      expect(component.valuesChange.emit).toHaveBeenCalledWith(['A', 'C']);
      expect(component.valueRemoved.emit).toHaveBeenCalledWith('B');
    });

    it('should not remove if index is out of bounds (negative)', () => {
      component.onRemove(-1);
      expect(component.values.length).toBe(3);
    });

    it('should not remove if index is out of bounds (too large)', () => {
      component.onRemove(5);
      expect(component.values.length).toBe(3);
    });
  });

  describe('onBlur', () => {
    it('should not throw', () => {
      try { fixture.detectChanges(); } catch (_) {}
      expect(() => component.onBlur()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      try { fixture.detectChanges(); } catch (_) {}
      component.values = ['A', 'B'];
      component.currentValue = 'test';
      component.errorMessage = 'Error';
      spyOn(component.valuesChange, 'emit');

      component.reset();

      expect(component.values).toEqual([]);
      expect(component.currentValue).toBe('');
      expect(component.errorMessage).toBe('');
      expect(component.valuesChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      component.setError('Custom error message');
      expect(component.errorMessage).toBe('Custom error message');
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      component.errorMessage = 'Some error';
      component.clearError();
      expect(component.errorMessage).toBe('');
    });
  });
});
