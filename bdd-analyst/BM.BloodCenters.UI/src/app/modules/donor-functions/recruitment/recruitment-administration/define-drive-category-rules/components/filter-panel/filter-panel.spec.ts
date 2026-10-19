import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';
import { DriveCategoryRuleFilterPanel } from './filter-panel';

describe('DriveCategoryRuleFilterPanel', () => {
  let component: DriveCategoryRuleFilterPanel;
  let fixture: ComponentFixture<DriveCategoryRuleFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriveCategoryRuleFilterPanel, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DriveCategoryRuleFilterPanel);
    component = fixture.componentInstance;
  });




  it('should serialize dates to YYYY-MM-DD format', () => {
    spyOn(component.apply, 'emit');
    component.ngOnInit();

    component.filterForm.patchValue({
      showTerminated: false,
      effectiveDatePeriod: 'After',
      effectiveDateValue: moment('2025-03-15'),
      terminationDatePeriod: 'Before',
      terminationDateValue: moment('2025-12-31')
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({
      showTerminated: false,
      effectiveDatePeriod: 'After',
      effectiveDateValue: '2025-03-15',
      terminationDatePeriod: 'Before',
      terminationDateValue: '2025-12-31'
    });
  });



  it('should not include period if date is null', () => {
    spyOn(component.apply, 'emit');
    component.ngOnInit();

    component.filterForm.patchValue({
      showTerminated: false,
      effectiveDatePeriod: 'After',
      effectiveDateValue: null,
      terminationDatePeriod: 'Before',
      terminationDateValue: null
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({
      showTerminated: false,
      effectiveDatePeriod: null,
      effectiveDateValue: null,
      terminationDatePeriod: null,
      terminationDateValue: null
    });
  });

  it('should provide period options', () => {
    expect(component.periodOptions.length).toBe(2);
    expect(component.periodOptions[0].value).toBe('Before');
    expect(component.periodOptions[1].value).toBe('After');
  });
});
