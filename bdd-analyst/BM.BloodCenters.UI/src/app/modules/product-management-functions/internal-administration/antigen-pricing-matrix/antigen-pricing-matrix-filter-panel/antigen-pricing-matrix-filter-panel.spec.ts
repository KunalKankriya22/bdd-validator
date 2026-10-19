import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AntigenPricingMatrixFilterPanel } from './antigen-pricing-matrix-filter-panel';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { AntigenPricingMatrixFilterValue } from '../models/antigen-pricing-matrix.model';

describe('AntigenPricingMatrixFilterPanel', () => {
  let component: AntigenPricingMatrixFilterPanel;
  let fixture: ComponentFixture<AntigenPricingMatrixFilterPanel>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(async () => {
    mockHeaderService = createMockHeaderService();

    await TestBed.configureTestingModule({
      imports: [AntigenPricingMatrixFilterPanel, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AntigenPricingMatrixFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the filter form with expected controls', () => {
    // Arrange - form initialized in ngOnInit via beforeEach

    // Act
    const form = component.filterForm;

    // Assert
    expect(form).toBeTruthy();
    expect(form.get('serviceCode')).toBeTruthy();
    expect(form.get('effDatePeriod')).toBeTruthy();
    expect(form.get('effDate')).toBeTruthy();
    expect(form.get('termDatePeriod')).toBeTruthy();
    expect(form.get('termDate')).toBeTruthy();
  });

  it('should initialize form controls with null values when no currentFilters provided', () => {
    // Arrange - no currentFilters set

    // Act & Assert
    expect(component.filterForm.get('serviceCode')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should emit close event when onClose is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onClose();

    // Assert
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit apply event with filter values when onApply is called with a service code', () => {
    // Arrange
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({ serviceCode: 'SVC001' });

    // Act
    component.onApply();

    // Assert
    expect(component.apply.emit).toHaveBeenCalled();
    const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as AntigenPricingMatrixFilterValue;
    expect(emittedFilters.serviceCode).toBe('SVC001');
  });

  it('should not include serviceCode in emitted filters when it is empty', () => {
    // Arrange
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({
      serviceCode: null,
      effDate: new Date(2025, 5, 15),
      effDatePeriod: 'before'
    });

    // Act
    component.onApply();

    // Assert
    const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as AntigenPricingMatrixFilterValue;
    expect(emittedFilters.serviceCode).toBeUndefined();
  });

  it('should reset all form fields and validation flags when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue({
      serviceCode: 'SVC001',
      effDatePeriod: 'before',
      effDate: new Date(),
      termDatePeriod: 'after',
      termDate: new Date()
    });
    component.effPeriodRequired = true;
    component.termPeriodRequired = true;

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.get('serviceCode')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
    expect(component.effPeriodRequired).toBeFalse();
    expect(component.termPeriodRequired).toBeFalse();
  });

  it('should set effPeriodRequired to true when effDate has value but effDatePeriod does not', fakeAsync(() => {
    // Arrange
    component.filterForm.patchValue({
      effDate: new Date(2025, 5, 15),
      effDatePeriod: null
    });

    // Act
    component.validateEffPeriod();
    tick();

    // Assert
    expect(component.effPeriodRequired).toBeTrue();
  }));

  it('should set effPeriodRequired to false when both effDate and effDatePeriod have values', fakeAsync(() => {
    // Arrange
    component.filterForm.patchValue({
      effDate: new Date(2025, 5, 15),
      effDatePeriod: 'before'
    });

    // Act
    component.validateEffPeriod();
    tick();

    // Assert
    expect(component.effPeriodRequired).toBeFalse();
  }));

  it('should set termPeriodRequired to true when termDate has value but termDatePeriod does not', fakeAsync(() => {
    // Arrange
    component.filterForm.patchValue({
      termDate: new Date(2025, 11, 31),
      termDatePeriod: null
    });

    // Act
    component.validateTermPeriod();
    tick();

    // Assert
    expect(component.termPeriodRequired).toBeTrue();
  }));

  it('should set termPeriodRequired to false when termDate is empty', fakeAsync(() => {
    // Arrange
    component.filterForm.patchValue({
      termDate: null,
      termDatePeriod: null
    });

    // Act
    component.validateTermPeriod();
    tick();

    // Assert
    expect(component.termPeriodRequired).toBeFalse();
  }));

  it('should return isApplyDisabled true when effPeriodRequired is true', () => {
    // Arrange
    component.effPeriodRequired = true;

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return isApplyDisabled true when termPeriodRequired is true', () => {
    // Arrange
    component.termPeriodRequired = true;

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return isApplyDisabled true when no filter values are set', () => {
    // Arrange
    component.effPeriodRequired = false;
    component.termPeriodRequired = false;
    component.filterForm.patchValue({
      serviceCode: null,
      effDate: null,
      termDate: null
    });

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return isApplyDisabled false when serviceCode has a value and no validation issues', () => {
    // Arrange
    component.effPeriodRequired = false;
    component.termPeriodRequired = false;
    component.filterForm.patchValue({ serviceCode: 'SVC001' });

    // Act & Assert
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should return empty string from getEffectiveDateError when no errors on effDate', () => {
    // Arrange - effDate has no errors by default

    // Act & Assert
    expect(component.getEffectiveDateError()).toBe('');
  });

  it('should return empty string from getTerminationDateError when no errors on termDate', () => {
    // Arrange - termDate has no errors by default

    // Act & Assert
    expect(component.getTerminationDateError()).toBe('');
  });

  it('should filter serviceCodeOptions based on search term', fakeAsync(() => {
    // Arrange
    component.serviceCodeOptions = ['SVC001', 'SVC002', 'OTHER01'];
    component.filteredServiceCodeOptions = [...component.serviceCodeOptions];
    // Re-initialize to pick up the options
    component.ngOnDestroy();
    component.ngOnInit();

    // Act
    component.serviceCodeSearchControl.setValue('SVC');
    tick();

    // Assert
    expect(component.filteredServiceCodeOptions).toEqual(['SVC001', 'SVC002']);
  }));

  it('should reset serviceCodeSearchControl when onClear is called', () => {
    // Arrange
    component.serviceCodeSearchControl.setValue('some search text');

    // Act
    component.onClear();

    // Assert
    expect(component.serviceCodeSearchControl.value).toBe('');
  });

  it('should trigger validateEffPeriod when effDate valueChanges fires', fakeAsync(() => {
    spyOn(component, 'validateEffPeriod').and.callThrough();

    component.filterForm.get('effDate')?.setValue(new Date(2025, 5, 15));
    tick(0);

    expect(component.validateEffPeriod).toHaveBeenCalled();
  }));

  it('should trigger validateTermPeriod when termDate valueChanges fires', fakeAsync(() => {
    spyOn(component, 'validateTermPeriod').and.callThrough();

    component.filterForm.get('termDate')?.setValue(new Date(2025, 11, 31));
    tick(0);

    expect(component.validateTermPeriod).toHaveBeenCalled();
  }));

  it('should trigger validateEffPeriod when effDatePeriod valueChanges fires', () => {
    spyOn(component, 'validateEffPeriod').and.callThrough();

    component.filterForm.get('effDatePeriod')?.setValue('before');

    expect(component.validateEffPeriod).toHaveBeenCalled();
  });

  it('should trigger validateTermPeriod when termDatePeriod valueChanges fires', () => {
    spyOn(component, 'validateTermPeriod').and.callThrough();

    component.filterForm.get('termDatePeriod')?.setValue('after');

    expect(component.validateTermPeriod).toHaveBeenCalled();
  });

  it('should return error message from getEffectiveDateError when matDatepickerParse error is set', () => {
    component.filterForm.get('effDate')?.setErrors({ matDatepickerParse: true });
    component.filterForm.get('effDate')?.markAsTouched();

    const error = component.getEffectiveDateError();

    expect(error).toBeTruthy();
  });

  it('should return error message from getTerminationDateError when matDatepickerParse error is set', () => {
    component.filterForm.get('termDate')?.setErrors({ matDatepickerParse: true });
    component.filterForm.get('termDate')?.markAsTouched();

    const error = component.getTerminationDateError();

    expect(error).toBeTruthy();
  });

  it('should return error from getTerminationDateError when invalidDateFormat error is set', () => {
    component.filterForm.get('termDate')?.setErrors({ invalidDateFormat: true });

    const error = component.getTerminationDateError();

    expect(error).toBeTruthy();
  });

  it('should return isApplyDisabled true when date errors exist on effDate', () => {
    component.effPeriodRequired = false;
    component.termPeriodRequired = false;
    component.filterForm.get('effDate')?.setErrors({ invalidDateFormat: true });

    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return isApplyDisabled true when antigenQty is invalid and set', () => {
    component.effPeriodRequired = false;
    component.termPeriodRequired = false;
    // Set an out-of-range value to trigger the min validator
    component.filterForm.get('antigenQty')?.setValue(0);
    component.filterForm.get('antigenQty')?.markAsTouched();

    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return isApplyDisabled false when antigenQty has valid value', () => {
    component.effPeriodRequired = false;
    component.termPeriodRequired = false;
    component.filterForm.get('antigenQty')?.setValue(5);

    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should emit apply with effDate and termDate filters when onApply is called with dates', () => {
    spyOn(component.apply, 'emit');
    const testDate = new Date(2025, 5, 15);
    component.filterForm.patchValue({
      effDate: testDate,
      effDatePeriod: 'before',
      termDate: new Date(2025, 11, 31),
      termDatePeriod: 'after'
    });

    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as any;
    expect(emitted.effDatePeriod).toBe('before');
    expect(emitted.effDate).toBeTruthy();
    expect(emitted.termDatePeriod).toBe('after');
    expect(emitted.termDate).toBeTruthy();
  });

  it('should emit apply with antigenQty when set', () => {
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({ antigenQty: 3 });

    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as any;
    expect(emitted.antigenQty).toBe(3);
  });

  it('should mark effDate as touched when its valueChanges fires and it is untouched', fakeAsync(() => {
    const control = component.filterForm.get('effDate');
    control?.markAsUntouched();

    control?.setValue(new Date(2025, 0, 1));
    tick(0);

    expect(control?.touched).toBeTrue();
  }));
});
