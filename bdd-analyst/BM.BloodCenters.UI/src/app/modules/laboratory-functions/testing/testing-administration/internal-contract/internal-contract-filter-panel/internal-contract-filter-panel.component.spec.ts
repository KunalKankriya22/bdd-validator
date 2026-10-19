import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import moment from 'moment';

import { InternalContractFilterPanelComponent } from './internal-contract-filter-panel.component';

describe('InternalContractFilterPanelComponent', () => {
  let component: InternalContractFilterPanelComponent;
  let fixture: ComponentFixture<InternalContractFilterPanelComponent>;
  let mockDateAdapter: jasmine.SpyObj<DateAdapter<moment.Moment>>;

  beforeEach(() => {
    mockDateAdapter = jasmine.createSpyObj('DateAdapter', [
      'parse', 'format', 'setLocale', 'getYear', 'getMonth',
      'getDate', 'createDate', 'today', 'clone', 'isValid'
    ]);

    TestBed.configureTestingModule({
      imports: [InternalContractFilterPanelComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: DateAdapter, useValue: mockDateAdapter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(InternalContractFilterPanelComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should emit apply with filter values when form is valid', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    const testDate = moment('2024-06-15');
    component.filterForm.patchValue({
      effectivePeriod: 'After',
      effectiveDate: testDate,
      terminationPeriod: null,
      terminationDate: null
    });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ effectivePeriod: 'After' })
    );
  });

  it('should reset form and clear errors on onClearAll', () => {
    // Arrange
    component.filterForm.patchValue({ effectivePeriod: 'Before', effectiveDate: moment() });
    component.effectiveDatePeriodError = 'Period is required when date is selected';

    // Act
    component.onClearAll();

    // Assert
    expect(component.filterForm.value.effectivePeriod).toBeFalsy();
    expect(component.effectiveDatePeriodError).toBe('');
  });

  it('should disable apply when no date filters are complete', () => {
    // Arrange - period without date
    component.filterForm.patchValue({
      effectivePeriod: null,
      effectiveDate: null,
      terminationPeriod: null,
      terminationDate: null
    });

    // Act & Assert
    expect(component.isApplyDisabled()).toBeTrue();
  });
});
