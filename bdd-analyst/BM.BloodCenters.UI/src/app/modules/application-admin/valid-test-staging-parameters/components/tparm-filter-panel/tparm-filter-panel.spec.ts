import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import moment from 'moment';

import { TparmFilterPanelComponent } from './tparm-filter-panel';
import { TparmApiService } from '../../services/tparm-api.service';

describe('TparmFilterPanelComponent', () => {
  let component: TparmFilterPanelComponent;
  let fixture: ComponentFixture<TparmFilterPanelComponent>;
  let mockApiService: jasmine.SpyObj<TparmApiService>;

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('TparmApiService', [
      'getDatatypes',
      'getVoidCodes',
      'getRelatedCodes'
    ]);

    mockApiService.getDatatypes.and.returnValue(of([
      { typeCode: 'DT1', description: 'Datatype 1' },
      { typeCode: 'DT2', description: 'Datatype 2' }
    ]));
    mockApiService.getVoidCodes.and.returnValue(of([
      { code: 'VC1', codeDesc: 'Void Code 1' }
    ]));
    mockApiService.getRelatedCodes.and.returnValue(of([
      { code: 'RC1', codeDesc: 'Related Code 1' }
    ]));

    TestBed.configureTestingModule({
      imports: [TparmFilterPanelComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        { provide: TparmApiService, useValue: mockApiService }
      ]
    });

    fixture = TestBed.createComponent(TparmFilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with null defaults', () => {
    expect(component.filterForm.value.datatype).toBeNull();
    expect(component.filterForm.value.relatedCode).toBeNull();
    expect(component.filterForm.value.voidCode).toBeNull();
    expect(component.filterForm.value.effDateOperator).toBeNull();
    expect(component.filterForm.value.effDateValue).toBeNull();
  });

  it('should load datatypes and void codes on init', () => {
    expect(mockApiService.getDatatypes).toHaveBeenCalled();
    expect(mockApiService.getVoidCodes).toHaveBeenCalled();
  });

  describe('isApplyDisabled', () => {
    it('should return true when no fields are populated', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should return false when datatype is selected', () => {
      component.filterForm.patchValue({ datatype: 'DT1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return false when voidCode is selected', () => {
      component.filterForm.patchValue({ voidCode: 'VC1' });
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should return true when date period has errors', () => {
      component.filterForm.patchValue({ datatype: 'DT1' });
      component.filterForm.get('effDateOperator')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBeTrue();
    });
  });

  describe('onApply', () => {
    it('should emit apply with filter state', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({ datatype: 'DT1', voidCode: 'VC1' });
      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          datatype: 'DT1',
          voidCode: 'VC1',
          relatedCode: null
        })
      );
    });

    it('should not emit when validation errors exist', () => {
      spyOn(component.apply, 'emit');

      // Set a valid date without an operator so validateEffDatePeriod() sets the error
      component.filterForm.patchValue({ effDateValue: moment('2026-01-15'), effDateOperator: null });
      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should reset form and clear search controls', () => {
      component.filterForm.patchValue({ datatype: 'DT1', voidCode: 'VC1' });
      component.datatypeSearchControl.setValue('search');
      component.voidCodeSearchControl.setValue('search');

      component.onClearAll();

      expect(component.filterForm.value.datatype).toBeNull();
      expect(component.filterForm.value.voidCode).toBeNull();
      expect(component.datatypeSearchControl.value).toBe('');
      expect(component.voidCodeSearchControl.value).toBe('');
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('datatype change', () => {
    it('should load related codes when datatype is selected', fakeAsync(() => {
      component.filterForm.patchValue({ datatype: 'DT1' });
      tick();

      expect(mockApiService.getRelatedCodes).toHaveBeenCalledWith('DT1');
    }));

    it('should clear related code when datatype changes', fakeAsync(() => {
      component.filterForm.patchValue({ datatype: 'DT1', relatedCode: 'RC1' });
      tick();

      component.filterForm.patchValue({ datatype: 'DT2' });
      tick();

      expect(component.filterForm.value.relatedCode).toBeNull();
    }));
  });

  describe('date period validation', () => {
    it('should set error on effDateOperator when date is set without operator', fakeAsync(() => {
      component.filterForm.patchValue({ effDateValue: moment('2026-01-15'), effDateOperator: null });
      tick();

      const operatorControl = component.filterForm.get('effDateOperator');
      expect(operatorControl?.hasError('required')).toBeTrue();
    }));

    it('should clear error when operator is selected', fakeAsync(() => {
      component.filterForm.patchValue({ effDateValue: moment('2026-01-15'), effDateOperator: 'AFTER' });
      tick();

      const operatorControl = component.filterForm.get('effDateOperator');
      expect(operatorControl?.errors).toBeNull();
    }));
  });

  describe('dropdown closed handlers', () => {
    it('should clear datatype search on dropdown close', () => {
      component.datatypeSearchControl.setValue('search');

      component.onDatatypeDropdownClosed();

      expect(component.datatypeSearchControl.value).toBe('');
    });

    it('should clear related code search on dropdown close', () => {
      component.relatedCodeSearchControl.setValue('search');

      component.onRelatedCodeDropdownClosed();

      expect(component.relatedCodeSearchControl.value).toBe('');
    });

    it('should clear void code search on dropdown close', () => {
      component.voidCodeSearchControl.setValue('search');

      component.onVoidCodeDropdownClosed();

      expect(component.voidCodeSearchControl.value).toBe('');
    });
  });
});
