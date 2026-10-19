import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup, FormControl, ControlContainer, ReactiveFormsModule, Validators } from '@angular/forms';

import { BasePasswordChildComponent } from './base-password-child.component';

@Component({
  selector: 'app-test-password-child',
  standalone: false,
  template: ''
})
class TestPasswordChildComponent extends BasePasswordChildComponent {
  constructor(cc: ControlContainer) {
    super(cc);
  }
}

describe('BasePasswordChildComponent', () => {
  let component: TestPasswordChildComponent;
  let mockControlContainer: jasmine.SpyObj<ControlContainer>;
  let testFormGroup: FormGroup;

  beforeEach(() => {
    testFormGroup = new FormGroup({
      minLength: new FormControl(8, [Validators.min(1)]),
      maxLength: new FormControl(16)
    });

    mockControlContainer = jasmine.createSpyObj('ControlContainer', [], {
      control: testFormGroup
    });

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [TestPasswordChildComponent],
      providers: [
        { provide: ControlContainer, useValue: mockControlContainer }
      ]
    });

    const fixture = TestBed.createComponent(TestPasswordChildComponent);
    component = fixture.componentInstance;
    component.parentForm = new FormGroup({});
  });

  it('should return the form group from control container', () => {
    // Act & Assert
    expect(component.group).toBe(testFormGroup);
  });

  it('should return true for getFieldError when field is dirty and has error', () => {
    // Arrange
    const control = testFormGroup.get('minLength')!;
    control.setValue(-1);
    control.markAsDirty();

    // Act & Assert
    expect(component.getFieldError('minLength', 'min')).toBeTrue();
  });

  it('should return false for getFieldError when field has no error', () => {
    // Arrange
    const control = testFormGroup.get('minLength')!;
    control.setValue(8);
    control.markAsDirty();

    // Act & Assert
    expect(component.getFieldError('minLength', 'min')).toBeFalse();
  });
});
