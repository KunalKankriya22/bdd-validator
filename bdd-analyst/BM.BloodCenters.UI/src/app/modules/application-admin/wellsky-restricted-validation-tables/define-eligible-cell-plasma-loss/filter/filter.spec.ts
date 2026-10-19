import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Filter } from './filter';

describe('Filter', () => {
  let component: Filter;
  let fixture: ComponentFixture<Filter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Filter,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Filter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });






  it('should apply filters when cellType is not provided but showAllRecords is checked', () => {
    spyOn(component.apply, 'emit');

    // Check showAllRecords (makes cellType optional)
    component.filterForm.patchValue({
      cellType: null,
      showAllRecords: true
    });

    component.onApply();

    // Apply should be called because cellType is optional when showAllRecords is checked
    expect(component.apply.emit).toHaveBeenCalledWith({
      cellType: null,
      status: 'all'
    });
  });

  it('should apply filters when cellType is provided and showAllRecords is checked', () => {
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({
      cellType: 'PLASM',
      showAllRecords: true
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({
      cellType: 'PLASM',
      status: 'all'
    });
  });





  it('should enable apply button when showAllRecords is checked', () => {
    component.filterForm.patchValue({
      cellType: null,
      showAllRecords: true
    });

    expect(component.isApplyDisabled).toBe(false);
  });

  it('should enable apply button when both filters are set', () => {
    component.filterForm.patchValue({
      cellType: 'RBC',
      showAllRecords: true
    });

    expect(component.isApplyDisabled).toBe(false);
  });
});
