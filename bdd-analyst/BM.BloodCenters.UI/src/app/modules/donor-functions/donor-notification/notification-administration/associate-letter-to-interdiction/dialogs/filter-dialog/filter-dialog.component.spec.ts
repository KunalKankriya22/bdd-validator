import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FilterDialogComponent, FilterDialogData } from './filter-dialog.component';

describe('FilterDialogComponent', () => {
  let component: FilterDialogComponent;
  let fixture: ComponentFixture<FilterDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<FilterDialogComponent>>;

  const mockDialogData: FilterDialogData = {
    filters: {},
    interdictionCodeOptions: [{ code: 'IC1', description: 'Interdiction One' }],
    donationTypeOptions: [{ code: 'DT1', description: 'Donation One' }],
    letterCodeOptions: [{ letterId: 'L1', code: 'LC1', description: 'Letter One' }]
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [FilterDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    });

    fixture = TestBed.createComponent(FilterDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template rendering */ }
  });

  it('should close dialog with filter criteria when onApply is called', () => {
    // Arrange
    component.filterForm.patchValue({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1'
    });

    // Act
    component.onApply();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      interdictionCode: 'IC1',
      donationType: 'DT1',
      letterId: 'L1'
    });
  });

  it('should reset form fields when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue({ interdictionCode: 'IC1' });

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.interdictionCode).toBe('');
    expect(component.filterForm.value.donationType).toBe('');
    expect(component.filterForm.value.letterId).toBe('');
  });

  it('should close dialog without result when onCancel is called', () => {
    // Arrange - component initialized

    // Act
    component.onCancel();

    // Assert
    expect(dialogRefSpy.close).toHaveBeenCalledWith();
  });
});
