import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { CustomerProfileFilterPanelComponent, CustomerProfileFilterValue } from './customer-profile-filter-panel';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

describe('CustomerProfileFilterPanelComponent', () => {
  let component: CustomerProfileFilterPanelComponent;
  let fixture: ComponentFixture<CustomerProfileFilterPanelComponent>;
  let mockApiService: jasmine.SpyObj<CustomerProfileApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('CustomerProfileApiService', ['getCustomerTypes']);
    mockApiService.getCustomerTypes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        CustomerProfileFilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CustomerProfileApiService, useValue: mockApiService }
      ]
    });

    fixture = TestBed.createComponent(CustomerProfileFilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('customerType')?.value).toBeNull();
    expect(component.filterForm.get('effPeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termPeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      customerType: 'HOSPITAL',
      effDateAfter: '2025-01-01'
    };
    fixture.detectChanges();

    expect(component.filterForm.get('customerType')?.value).toBe('HOSPITAL');
    expect(component.filterForm.get('effPeriod')?.value).toBe('After');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ customerType: 'CLINIC' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      customerType: 'CLINIC'
    }));
  });

  it('should not emit apply when isApplyDisabled is true', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.onApply();

    expect(component.apply.emit).not.toHaveBeenCalled();
  });

  it('should reset form and emit empty filters on onClear', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ customerType: 'HOSPITAL' });
    component.onClear();

    expect(component.filterForm.get('customerType')?.value).toBeNull();
    expect(component.apply.emit).toHaveBeenCalledWith({});
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set period validation error when date is set without period', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ effDate: new Date(2025, 0, 1), effPeriod: null });

    expect(component.filterForm.get('effPeriod')?.hasError('required')).toBeTrue();
  });

  it('should load customer types from service', () => {
    const types = [{ code: 'HOSP', description: 'Hospital' }];
    mockApiService.getCustomerTypes.and.returnValue(of(types));

    fixture.detectChanges();

    expect(component.customerTypes()).toEqual(types as any);
  });

  it('should filter customer types based on search input', () => {
    const types = [
      { code: 'HOSP', description: 'Hospital' },
      { code: 'CLIN', description: 'Clinic' }
    ];
    mockApiService.getCustomerTypes.and.returnValue(of(types));

    fixture.detectChanges();

    component.customerTypeSearchCtrl.setValue('clinic');

    expect(component.filteredCustomerTypes.length).toBe(1);
    expect(component.filteredCustomerTypes[0].code).toBe('CLIN');
  });
});
