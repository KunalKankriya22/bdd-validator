import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AlternateIdFilterPanel } from './alternate-id-filter-panel';

describe('AlternateIdFilterPanel', () => {
  let component: AlternateIdFilterPanel;
  let fixture: ComponentFixture<AlternateIdFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AlternateIdFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(AlternateIdFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('keyDataGrade')?.value).toBeNull();
    expect(component.filterForm.get('altidMatchType')?.value).toBeNull();
    expect(component.filterForm.get('finalGrade')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      keyDataGrade: 'A',
      altidMatchType: 'EXACT',
      finalGrade: 'B'
    };
    fixture.detectChanges();

    expect(component.filterForm.get('keyDataGrade')?.value).toBe('A');
    expect(component.filterForm.get('altidMatchType')?.value).toBe('EXACT');
    expect(component.filterForm.get('finalGrade')?.value).toBe('B');
  });

  it('should emit apply event with filter values on applyFilter', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ keyDataGrade: 'A' });
    component.applyFilter();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      keyDataGrade: 'A'
    }));
  });

  it('should reset form and validation flags on clearAll', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ keyDataGrade: 'A' });
    component.effDatePeriodRequired = true;

    component.clearAll();

    expect(component.filterForm.get('keyDataGrade')?.value).toBeNull();
    expect(component.effDatePeriodRequired).toBeFalse();
    expect(component.termDatePeriodRequired).toBeFalse();
  });

  it('should emit close event on closePanel', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.closePanel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set effDatePeriodRequired when date is set without period', () => {
    fixture.detectChanges();

    const moment = require('moment');
    component.filterForm.patchValue({
      effDate: moment('2025-01-01'),
      effDatePeriod: null
    });
    component.validateEffDatePeriod();

    expect(component.effDatePeriodRequired).toBeTrue();
  });

  it('should return true for isApplyDisabled when no filters set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return false for isApplyDisabled when a filter has a value', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ keyDataGrade: 'A' });
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should filter key grade options based on search', () => {
    component.keyGradeOptions = [
      { value: 'A', label: 'Grade A' },
      { value: 'B', label: 'Grade B' }
    ];
    fixture.detectChanges();

    component.keyGradeSearchCtrl.setValue('grade b');

    const filtered = component.filteredKeyGrades();
    expect(filtered.length).toBe(1);
    expect(filtered[0].value).toBe('B');
  });
});
