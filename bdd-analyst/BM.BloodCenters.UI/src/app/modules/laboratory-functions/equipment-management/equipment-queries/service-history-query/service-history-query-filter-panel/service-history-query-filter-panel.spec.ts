import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ServiceHistoryQueryFilterPanel } from './service-history-query-filter-panel';
import { ServiceHistoryQueryService } from '../services/service-history-query.service';

describe('ServiceHistoryQueryFilterPanel', () => {
  let component: ServiceHistoryQueryFilterPanel;
  let fixture: ComponentFixture<ServiceHistoryQueryFilterPanel>;
  let mockService: jasmine.SpyObj<ServiceHistoryQueryService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ServiceHistoryQueryService', [
      'getEquipmentTypes',
      'getEquipmentIds',
      'getEquipmentReferences'
    ]);
    mockService.getEquipmentTypes.and.returnValue(of([]));
    mockService.getEquipmentIds.and.returnValue(of([]));
    mockService.getEquipmentReferences.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        ServiceHistoryQueryFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ServiceHistoryQueryService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(ServiceHistoryQueryFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('equipmentType')?.value).toBeNull();
    expect(component.filterForm.get('equipmentId')?.value).toBeNull();
    expect(component.filterForm.get('equipmentReference')?.value).toBeNull();
    expect(component.filterForm.get('startDate')?.value).toBeNull();
    expect(component.filterForm.get('endDate')?.value).toBeNull();
  });

  it('should patch form with currentFilters on init', () => {
    component.currentFilters = {
      equipmentType: 'CENTRIFUGE',
      equipmentId: null,
      equipmentTypeDescription: null,
      equipmentReference: null,
      startDate: null,
      endDate: null
    };
    fixture.detectChanges();

    expect(component.filterForm.get('equipmentType')?.value).toBe('CENTRIFUGE');
  });

  it('should emit apply event with filter values on applyFilters', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ equipmentType: 'SCALE' });
    component.applyFilters();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      equipmentType: 'SCALE'
    }));
  });

  it('should reset form and clear dependent arrays on clearFilters', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ equipmentType: 'SCALE' });
    component.equipmentIds = [{ equipId: '1' }] as any;

    component.clearFilters();

    expect(component.filterForm.get('equipmentType')?.value).toBeFalsy();
    expect(component.equipmentIds).toEqual([]);
    expect(component.equipmentReferences).toEqual([]);
  });

  it('should emit close event on closePanel', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.closePanel();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should load equipment types on init', () => {
    const types = [{ equipType: 'CENT', equipTypeDescription: 'Centrifuge' }];
    mockService.getEquipmentTypes.and.returnValue(of(types));

    fixture.detectChanges();

    expect(component.equipmentTypes).toEqual(types as any);
    expect(component.isLoadingTypes).toBeFalse();
  });

  it('should load equipment IDs when equipment type changes', () => {
    fixture.detectChanges();

    const ids = [{ equipId: 'ID-1' }];
    mockService.getEquipmentIds.and.returnValue(of(ids));

    component.filterForm.get('equipmentType')?.setValue('CENT');

    expect(mockService.getEquipmentIds).toHaveBeenCalledWith('CENT');
  });

  it('should return true for isApplyDisabled when no filter is set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return false for isApplyDisabled when a filter has a value', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ equipmentType: 'SCALE' });
    expect(component.isApplyDisabled).toBeFalse();
  });
});
