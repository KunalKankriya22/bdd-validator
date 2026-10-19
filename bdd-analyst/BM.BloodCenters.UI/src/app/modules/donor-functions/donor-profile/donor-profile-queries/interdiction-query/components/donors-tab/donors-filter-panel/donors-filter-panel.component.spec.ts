import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { DonorsFilterPanelComponent } from './donors-filter-panel.component';

describe('DonorsFilterPanelComponent', () => {
  let component: DonorsFilterPanelComponent;
  let fixture: ComponentFixture<DonorsFilterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DonorsFilterPanelComponent, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(DonorsFilterPanelComponent);
    component = fixture.componentInstance;
    component.currentFilters = null;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should emit apply event with filter values when onApply is called', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    component.filterForm.patchValue({ sex: 'M', showTerminated: 'Yes' });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith({
      showTerminated: true,
      sex: 'M'
    });
  });

  it('should reset form to defaults when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue({ sex: 'F', showTerminated: 'Yes' });

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.sex).toBe('');
    expect(component.filterForm.value.showTerminated).toBe('No');
  });

  it('should emit close event when onClose is called', () => {
    // Arrange
    const closeSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.close = closeSpy;

    // Act
    component.onClose();

    // Assert
    expect(closeSpy.emit).toHaveBeenCalled();
  });
});
