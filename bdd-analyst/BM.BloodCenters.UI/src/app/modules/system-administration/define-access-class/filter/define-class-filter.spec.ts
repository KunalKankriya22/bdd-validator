import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DefineClassFilterComponent, DefineClassFilter } from './define-class-filter';
import { DefineAccessClassService, CodeFilterDropdownItem } from '../services/define-access-class.service';

describe('DefineClassFilterComponent', () => {
  let component: DefineClassFilterComponent;
  let fixture: ComponentFixture<DefineClassFilterComponent>;
  let mockService: jasmine.SpyObj<DefineAccessClassService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('DefineAccessClassService', [
      'getTypesFilterDropdown',
      'getCodeFilterDropdown',
    ]);
    mockService.getTypesFilterDropdown.and.returnValue(of([]));
    mockService.getCodeFilterDropdown.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DefineClassFilterComponent, NoopAnimationsModule],
      providers: [
        { provide: DefineAccessClassService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefineClassFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the filter form with all seven controls', () => {
    // Assert
    expect(component.filterForm.get('type')).toBeTruthy();
    expect(component.filterForm.get('code')).toBeTruthy();
    expect(component.filterForm.get('effectiveDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('effectiveDate')).toBeTruthy();
    expect(component.filterForm.get('terminationDatePeriod')).toBeTruthy();
    expect(component.filterForm.get('terminationDate')).toBeTruthy();
    expect(component.filterForm.get('status')).toBeTruthy();
  });

  it('should call getTypesFilterDropdown on initialization', () => {
    // Assert
    expect(mockService.getTypesFilterDropdown).toHaveBeenCalledWith('');
  });

  it('should populate typeOptions and filteredTypeOptions from service response', () => {
    // Arrange
    const mockTypes = [
      { type: 'A', description: 'Type A' },
      { type: 'B', description: 'Type B' },
    ];
    mockService.getTypesFilterDropdown.and.returnValue(of(mockTypes));

    // Act
    component.loadTypes();

    // Assert
    expect(component.typeOptions).toEqual(mockTypes);
    expect(component.filteredTypeOptions).toEqual(mockTypes);
  });

  it('should patch form with currentFilters when provided on init', () => {
    // Arrange
    const filters: DefineClassFilter = {
      type: 'TestType',
      code: 'TC',
      effectiveDatePeriod: 'AFTER',
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null,
      status: 'Active',
    };
    const newFixture = TestBed.createComponent(DefineClassFilterComponent);
    const newComponent = newFixture.componentInstance;
    newComponent.currentFilters = filters;
    newComponent.classname = 'TestClass';
    mockService.getCodeFilterDropdown.calls.reset();

    // Act
    newFixture.detectChanges();

    // Assert
    expect(newComponent.filterForm.get('type')?.value).toBe('TestType');
    expect(newComponent.filterForm.get('code')?.value).toBe('TC');
    expect(newComponent.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
    expect(newComponent.filterForm.get('status')?.value).toBe('Active');
    expect(mockService.getCodeFilterDropdown).toHaveBeenCalledWith('TestClass', 'TestType');
  });

  it('should emit form values when onApply is called', () => {
    // Arrange
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue(
      { type: 'T1', status: 'Active' },
      { emitEvent: false }
    );

    // Act
    component.onApply();

    // Assert
    expect(component.apply.emit).toHaveBeenCalledWith(component.filterForm.value);
  });

  it('should reset form fields and clear dropdown arrays when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue(
      { type: 'T1', status: 'Active' },
      { emitEvent: false }
    );
    component.codeOptions = [{ code: 'C1', description: 'Code 1' }];
    component.filteredCodeOptions = [{ code: 'C1', description: 'Code 1' }];
    component.typeOptions = [{ type: 'T1', description: 'Type 1' }];
    component.effectivePeriodRequired = true;
    component.terminationPeriodRequired = true;

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.get('type')?.value).toBeNull();
    expect(component.filterForm.get('code')?.value).toBeNull();
    expect(component.filterForm.get('status')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.codeOptions).toEqual([]);
    expect(component.filteredCodeOptions).toEqual([]);
    expect(component.effectivePeriodRequired).toBeFalse();
    expect(component.terminationPeriodRequired).toBeFalse();
  });

  it('should emit close event when onClose is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onClose();

    // Assert
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should disable apply button when no filter values are present', () => {
    // Assert - form is empty by default after initialization
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should enable apply button when a filter field has a value', () => {
    // Arrange
    component.filterForm.patchValue({ type: 'SomeType' }, { emitEvent: false });

    // Assert
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should disable apply button when effective date has a format error', () => {
    // Arrange
    component.filterForm.patchValue({ type: 'T1' }, { emitEvent: false });
    component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

    // Assert
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should reset code and load new code options when type selection changes', () => {
    // Arrange
    const mockCodes: CodeFilterDropdownItem[] = [
      { code: 'C1', description: 'Code 1' },
      { code: 'C2', description: 'Code 2' },
    ];
    mockService.getCodeFilterDropdown.and.returnValue(of(mockCodes));
    component.filterForm.get('code')?.setValue('OldCode', { emitEvent: false });

    // Act
    component.filterForm.get('type')?.setValue('NewType');

    // Assert
    expect(component.filterForm.get('code')?.value).toBeNull();
    expect(mockService.getCodeFilterDropdown).toHaveBeenCalledWith('', 'NewType');
    expect(component.codeOptions).toEqual(mockCodes);
    expect(component.filteredCodeOptions).toEqual(mockCodes);
  });
});
