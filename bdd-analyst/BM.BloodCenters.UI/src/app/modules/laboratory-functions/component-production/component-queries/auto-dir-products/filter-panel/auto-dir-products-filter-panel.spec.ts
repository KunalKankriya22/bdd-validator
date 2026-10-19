import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AutoDirProductsFilterPanelComponent } from './auto-dir-products-filter-panel';
import { AutoDirProductsApiService } from '../services/auto-dir-products-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';

describe('AutoDirProductsFilterPanelComponent', () => {
  let component: AutoDirProductsFilterPanelComponent;
  let fixture: ComponentFixture<AutoDirProductsFilterPanelComponent>;
  let mockApiService: jasmine.SpyObj<AutoDirProductsApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('AutoDirProductsApiService', [
      'getHospitals',
      'getPatients'
    ]);
    mockApiService.getHospitals.and.returnValue(of([]));
    mockApiService.getPatients.and.returnValue(of([]));

    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['showError']);

    TestBed.configureTestingModule({
      imports: [
        AutoDirProductsFilterPanelComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AutoDirProductsApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    });

    fixture = TestBed.createComponent(AutoDirProductsFilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('fromDate')?.value).toBeNull();
    expect(component.filterForm.get('toDate')?.value).toBeNull();
    expect(component.filterForm.get('hospitalId')?.value).toBe('');
    expect(component.filterForm.get('orderBy')?.value).toBe('UNIT');
  });

  it('should emit search event with filter values on onSearch', () => {
    fixture.detectChanges();
    spyOn(component.search, 'emit');

    component.filterForm.patchValue({ hospitalId: 'H1' });
    component.onSearch();

    expect(component.search.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      hospitalId: 'H1'
    }));
  });

  it('should show error when no search criteria provided', () => {
    fixture.detectChanges();

    component.onSearch();

    expect(mockSnackbarService.showError).toHaveBeenCalledWith(
      jasmine.stringContaining('At least one search criterion is required')
    );
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    spyOn(component.clear, 'emit');

    component.filterForm.patchValue({ hospitalId: 'H1', patientId: 'P1' });
    component.onClear();

    expect(component.filterForm.get('hospitalId')?.value).toBeFalsy();
    expect(component.filterForm.get('orderBy')?.value).toBe('UNIT');
    expect(component.clear.emit).toHaveBeenCalled();
  });

  it('should report hasActiveFilters correctly', () => {
    fixture.detectChanges();

    expect(component.hasActiveFilters()).toBeFalse();

    component.filterForm.patchValue({ hospitalId: 'H1' });
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should load hospital and patient lookups', () => {
    mockApiService.getHospitals.and.returnValue(of([
      { hospitalId: 'H1', hospitalName: 'Hospital 1' }
    ]));
    mockApiService.getPatients.and.returnValue(of([
      { patientId: 'P1', patientName: 'Patient 1' }
    ]));

    fixture.detectChanges();

    expect(component.hospitalOptions.length).toBe(1);
    expect(component.patientOptions.length).toBe(1);
  });

  it('should handle lookup loading error gracefully', () => {
    mockApiService.getHospitals.and.returnValue(throwError(() => new Error('fail')));
    mockApiService.getPatients.and.returnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();

    expect(component.hospitalOptions).toEqual([]);
    expect(component.patientOptions).toEqual([]);
    expect(component.lookupsLoading).toBeFalse();
  });

  it('should filter hospital options based on search', () => {
    mockApiService.getHospitals.and.returnValue(of([
      { hospitalId: 'H1', hospitalName: 'General Hospital' },
      { hospitalId: 'H2', hospitalName: 'Mercy Clinic' }
    ]));
    mockApiService.getPatients.and.returnValue(of([]));

    fixture.detectChanges();

    component.hospitalSearchControl.setValue('mercy');

    expect(component.filteredHospitalOptions.length).toBe(1);
  });
});
