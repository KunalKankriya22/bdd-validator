import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AddFunctionsFilterPanel } from './add-functions-filter-panel';
import { AddFunctionsService } from '../services/add-functions.service';
import { FilterPanelBase } from '@shared/components/filter-panel-base/filter-panel-base';

describe('AddFunctionsFilterPanel', () => {
  let component: AddFunctionsFilterPanel;
  let fixture: ComponentFixture<AddFunctionsFilterPanel>;
  let mockService: jasmine.SpyObj<AddFunctionsService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('AddFunctionsService', ['getFilters']);
    mockService.getFilters.and.returnValue(of({
      functionTypes: ['PAGE', 'MENU', 'OTHER'],
      functionScopes: ['GLOBAL', 'CHAPTER']
    }));

    TestBed.configureTestingModule({
      imports: [
        AddFunctionsFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AddFunctionsService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(AddFunctionsFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('functionType')?.value).toBeNull();
    expect(component.filterForm.get('scope')?.value).toBeNull();
  });

  it('should load filter options from service', () => {
    fixture.detectChanges();

    // Should filter to only PAGE and MENU
    expect(component.functionTypeOptions).toEqual(['PAGE', 'MENU']);
    expect(component.scopeOptions).toEqual(['GLOBAL', 'CHAPTER']);
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ functionType: 'PAGE', scope: 'GLOBAL' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({
      functionType: 'PAGE',
      scope: 'GLOBAL'
    });
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ functionType: 'MENU' });

    component.onClear();

    expect(component.filterForm.get('functionType')?.value).toBeNull();
    expect(component.filterForm.get('scope')?.value).toBeNull();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should return true for isApplyDisabled when no filters set', () => {
    fixture.detectChanges();
    expect(component.isApplyDisabled).toBeTrue();
  });

  it('should return false for isApplyDisabled when a filter has a value', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ functionType: 'PAGE' });
    expect(component.isApplyDisabled).toBeFalse();
  });

  it('should filter scope options based on search', () => {
    fixture.detectChanges();

    component.scopeSearchControl.setValue('chap');

    expect(component.filteredScopeOptions.length).toBe(1);
    expect(component.filteredScopeOptions[0]).toBe('CHAPTER');
  });

  it('should handle service error gracefully', () => {
    mockService.getFilters.and.returnValue(throwError(() => new Error('fail')));

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
