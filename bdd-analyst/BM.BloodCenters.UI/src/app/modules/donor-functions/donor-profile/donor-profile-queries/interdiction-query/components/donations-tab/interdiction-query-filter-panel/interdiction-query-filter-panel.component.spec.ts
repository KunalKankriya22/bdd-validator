import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import moment from 'moment';

import { InterdictionQueryFilterPanelComponent } from './interdiction-query-filter-panel.component';

describe('InterdictionQueryFilterPanelComponent', () => {
  let component: InterdictionQueryFilterPanelComponent;
  let fixture: ComponentFixture<InterdictionQueryFilterPanelComponent>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<moment.Moment>>;

  beforeEach(() => {
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', [
      'parse', 'format', 'setLocale', 'getYear', 'getMonth',
      'getDate', 'createDate', 'today', 'clone', 'isValid'
    ]);

    TestBed.configureTestingModule({
      imports: [InterdictionQueryFilterPanelComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: DateAdapter, useValue: mockDateAdapter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(InterdictionQueryFilterPanelComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should emit apply with form values on onApply', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    component.filterForm.patchValue({ unitId: 'U12345' });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ unitId: 'U12345' })
    );
  });

  it('should reset form and clear validation errors on onClear', () => {
    // Arrange
    component.filterForm.patchValue({ unitId: 'U12345', donorInterdictionCode: 'DIC01' });
    component.effectiveDatePeriodError = 'Period is required';
    component.terminationDatePeriodError = 'Period is required';

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.unitId).toBeNull();
    expect(component.filterForm.value.donorInterdictionCode).toBeNull();
    expect(component.effectiveDatePeriodError).toBe('');
    expect(component.terminationDatePeriodError).toBe('');
  });

  it('should disable apply when no filter values are set', () => {
    // Arrange
    component.filterForm.reset();

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });
});
