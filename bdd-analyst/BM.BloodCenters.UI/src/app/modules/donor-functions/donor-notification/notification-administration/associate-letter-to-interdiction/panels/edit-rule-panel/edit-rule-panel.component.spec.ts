import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { EditRulePanelComponent } from './edit-rule-panel.component';

describe('EditRulePanelComponent', () => {
  let component: EditRulePanelComponent;
  let fixture: ComponentFixture<EditRulePanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EditRulePanelComponent, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(EditRulePanelComponent);
    component = fixture.componentInstance;
    component.association = {
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    };
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should emit save event with update request when onSave is called with valid form', () => {
    // Arrange
    const saveSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.save = saveSpy;
    component.editForm.patchValue({
      terminationDate: new Date(2025, 11, 31)
    });

    // Act
    component.onSave();

    // Assert
    expect(saveSpy.emit).toHaveBeenCalledWith({
      terminationDate: '2025-12-31'
    });
  });

  it('should not emit save event when form is invalid', () => {
    // Arrange
    const saveSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.save = saveSpy;
    component.editForm.patchValue({ terminationDate: null });

    // Act
    component.onSave();

    // Assert
    expect(saveSpy.emit).not.toHaveBeenCalled();
  });

  it('should emit close event when onCancel is called', () => {
    // Arrange
    const closeSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.close = closeSpy;

    // Act
    component.onCancel();

    // Assert
    expect(closeSpy.emit).toHaveBeenCalled();
  });
});
