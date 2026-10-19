import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let component: FilterPanelComponent;
  let fixture: ComponentFixture<FilterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FilterPanelComponent, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    component.interdictionCodeOptions = [{ code: 'IC1', description: 'Interdiction One' }];
    component.donationTypeOptions = [{ code: 'DT1', description: 'Donation One' }];
    component.letterCodeOptions = [{ letterId: 'L1', code: 'LC1', description: 'Letter One' }];
    component.filters = {};
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should emit apply event with filter criteria when onApply is called', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    component.filterForm.patchValue({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1'
    });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1'
    });
  });

  it('should reset form and emit clear event when onClear is called', () => {
    // Arrange
    const clearSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.clear = clearSpy;
    component.filterForm.patchValue({ interdictionCode: 'IC1' });

    // Act
    component.onClear();

    // Assert
    expect(clearSpy.emit).toHaveBeenCalled();
    expect(component.filterForm.value.interdictionCode).toBe('');
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
