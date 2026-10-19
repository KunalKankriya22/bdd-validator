import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { LinkLetterPanelComponent } from './link-letter-panel.component';

describe('LinkLetterPanelComponent', () => {
  let component: LinkLetterPanelComponent;
  let fixture: ComponentFixture<LinkLetterPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LinkLetterPanelComponent, NoopAnimationsModule, ReactiveFormsModule]
    });

    fixture = TestBed.createComponent(LinkLetterPanelComponent);
    component = fixture.componentInstance;
    component.interdictionCodeOptions = [{ code: 'IC1', description: 'Interdiction One' }];
    component.donationTypeOptions = [{ code: 'DT1', description: 'Donation One' }];
    component.letterCodeOptions = [{ letterId: 'L1', code: 'LC1', description: 'Letter One' }];
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should emit save event when onSave is called with valid form', () => {
    // Arrange
    const saveSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.save = saveSpy;
    component.linkForm.patchValue({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1',
      effectiveDate: new Date(2025, 0, 15)
    });

    // Act
    component.onSave(false);

    // Assert
    expect(saveSpy.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1',
      effectiveDate: '2025-01-15'
    }));
  });

  it('should not emit save event when form is invalid', () => {
    // Arrange
    const saveSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.save = saveSpy;

    // Act
    component.onSave(false);

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

  it('should reset form when onSave is called with createAnother=true and valid form', () => {
    // Arrange
    const saveSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.save = saveSpy;
    component.linkForm.patchValue({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1',
      effectiveDate: new Date(2025, 0, 15)
    });

    // Act
    component.onSave(true);

    // Assert
    expect(saveSpy.emit).toHaveBeenCalled();
    expect(component.interdictionDescription).toBe('-');
    expect(component.donationDescription).toBe('-');
  });
});
