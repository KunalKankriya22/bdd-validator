import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { FilterPanelComponent, RbcAgGroupsFilter } from './filter-panel';

describe('FilterPanelComponent (RBC AG Groups)', () => {
  let component: FilterPanelComponent;
  let fixture: ComponentFixture<FilterPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterPanelComponent>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [
        FilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    });

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no dialog data', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
  });

  it('should patch form with dialog data when provided', () => {
    const dialogData: RbcAgGroupsFilter = {
      effectiveDate: new Date(2025, 0, 1),
      effectiveDatePeriod: 'AFTER',
      terminationDate: null,
      terminationDatePeriod: undefined
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [FilterPanelComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData }
      ]
    });

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
  });

  it('should close dialog with filters on onApply when valid', () => {
    fixture.detectChanges();

    component.filterForm.patchValue({
      effectiveDate: new Date(2025, 5, 15),
      effectiveDatePeriod: 'BEFORE'
    });
    (component as any).formChanged = true;

    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({
      effectiveDatePeriod: 'BEFORE'
    }));
  });

  it('should not close dialog on onApply when isApplyDisabled', () => {
    fixture.detectChanges();

    component.onApply();

    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      effectiveDate: new Date(),
      effectiveDatePeriod: 'AFTER'
    });

    component.onClear();

    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    expect(component.effectiveDatePeriodError).toBe('');
    expect(component.terminationDatePeriodError).toBe('');
  });

  it('should close dialog without data on closeDialog', () => {
    fixture.detectChanges();
    component.closeDialog();
    expect(mockDialogRef.close).toHaveBeenCalledWith();
  });

  it('should show period error when date set without period', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      effectiveDate: new Date(2025, 0, 1),
      effectiveDatePeriod: null
    });

    expect(component.effectiveDatePeriodError).toBe('Period is required');
  });

  it('should clear period error when both date and period are set', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      effectiveDate: new Date(2025, 0, 1),
      effectiveDatePeriod: 'AFTER'
    });

    expect(component.effectiveDatePeriodError).toBe('');
  });

  it('should report hasValidationErrors when period controls are invalid', () => {
    fixture.detectChanges();
    component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });

    expect(component.hasValidationErrors).toBeTrue();
  });
});
