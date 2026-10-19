import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';
import { FilterAssociateNicknameComponent } from './filter-associate-nickname';

describe('FilterAssociateNicknameComponent', () => {
  let component: FilterAssociateNicknameComponent;
  let fixture: ComponentFixture<FilterAssociateNicknameComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterAssociateNicknameComponent>>;

  beforeEach(() => {

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);



      TestBed.configureTestingModule({
      imports: [
        FilterAssociateNicknameComponent,
        HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    });


    


      mockDialogRef.close.calls.reset();


    fixture = TestBed.createComponent(FilterAssociateNicknameComponent);
    component = fixture.componentInstance;


    });


  it('should initialize with empty filters', () => {
    component.ngOnInit();

    const formValue = component.filterForm.value;
    expect(formValue.effDateType).toBeNull();
    expect(formValue.effDate).toBeNull();
    expect(formValue.termDateType).toBeNull();
    expect(formValue.termDate).toBeNull();
  });



  it('should apply filters with AFTER period', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDateType: 'AFTER',
      effDate: moment('2024-01-01'),
      termDateType: 'BEFORE',
      termDate: moment('2024-12-31')
    });

    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        effectivePeriod: 'AFTER',
        terminationPeriod: 'BEFORE'
      })
    );
  });

  it('should apply filters with BEFORE period', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDateType: 'BEFORE',
      effDate: moment('2024-01-01'),
      termDateType: 'AFTER',
      termDate: moment('2024-12-31')
    });

    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(
      jasmine.objectContaining({
        effectivePeriod: 'BEFORE',
        terminationPeriod: 'AFTER'
      })
    );
  });





  it('should validate period is required when date is selected', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDate: moment('2024-01-01'),
      effDateType: null
    });

    expect(component.effDatePeriodRequired).toBe(true);
  });

  it('should not show period error when date is null', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDate: null,
      effDateType: null
    });

    expect(component.effDatePeriodRequired).toBe(false);
  });

  it('should convert dates to UTC ISO string format', () => {
    component.ngOnInit();

    const testDate = moment('2024-01-15');
    component.filterForm.patchValue({
      effDateType: 'AFTER',
      effDate: testDate
    });

    component.onApply();

    const closeCallArg = mockDialogRef.close.calls.mostRecent().args[0];
    expect(closeCallArg.effectiveDate).toContain('2024-01-15');
    expect(closeCallArg.effectiveDate).toContain('T');
  });

  it('should handle null dates correctly', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDateType: null,
      effDate: null,
      termDateType: null,
      termDate: null
    });

    component.onApply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({});
  });

  it('should not apply if period is missing when date is selected', () => {
    component.ngOnInit();

    component.filterForm.patchValue({
      effDate: moment('2024-01-01'),
      effDateType: null
    });

    expect(component.isApplyDisabled).toBe(true);
  });


});
