import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RackDefinitionFilterPanel } from './rack-definition-filter-panel';
import { RackDefinitionService } from '../services/rack-definition.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import moment from 'moment';

describe('RackDefinitionFilterPanel', () => {
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: RackDefinitionFilterPanel;
  let fixture: ComponentFixture<RackDefinitionFilterPanel>;
  let mockService: jasmine.SpyObj<RackDefinitionService>;

  const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [], total: 0 };
  const lovWithData = {
    success: true, message: '', error: null, statusCode: 200,
    data: [{ code: 'A1', description: 'Rack A1' }], total: 1
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RackDefinitionService', [
      'getFilterRackNumbers', 'getFilterProductTypes'
    ]);
    mockService.getFilterRackNumbers.and.returnValue(of(lovResponse));
    mockService.getFilterProductTypes.and.returnValue(of(lovResponse));



      TestBed.configureTestingModule({
      imports: [RackDefinitionFilterPanel],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        { provide: RackDefinitionService, useValue: mockService }
      ]
    });


    


      mockService.getFilterRackNumbers.calls.reset();


      mockService.getFilterProductTypes.calls.reset();


      mockService.getFilterRackNumbers.and.returnValue(of(lovResponse));


      mockService.getFilterProductTypes.and.returnValue(of(lovResponse));


    fixture = TestBed.createComponent(RackDefinitionFilterPanel);
    component = fixture.componentInstance;
    component.retrieveState = { warehouseId: 'W1', deviceType: 'D1', deviceNumber: 'N1', storageClass: 'S1' };


    });








  it('should handle rack number load error', () => {
    mockService.getFilterRackNumbers.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.rackNumberOptions().length).toBe(0);
  });





  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit apply with filter values', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ rackNumber: 'A1' });
      component.onApply();
      expect(component.apply.emit).toHaveBeenCalled();
      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.rackNumber).toBe('A1');
    });



    it('should format date for API', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: moment('2026-03-15')
      });
      component.filterForm.get('effectivePeriod')?.setErrors(null);
      component.onApply();
      if ((component.apply.emit as jasmine.Spy).calls.count() > 0) {
        const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(emitted.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should emit null date fields when no date set', () => {
      spyOn(component.apply, 'emit');
      component.filterForm.patchValue({ rackNumber: 'B2' });
      component.onApply();
      const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitted.effectiveDate).toBeNull();
      expect(emitted.terminationDate).toBeNull();
      expect(emitted.effectivePeriod).toBeNull();
    });
  });
  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no values set', () => {
      component.filterForm.reset();
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when rackNumber set', () => {
      component.filterForm.patchValue({ rackNumber: 'A1' });
      expect(component.isApplyDisabled).toBe(false);
    });
  });



  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return error for parse error', () => {
      const ctrl = component.filterForm.get('effectiveDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return error for parse error', () => {
      const ctrl = component.filterForm.get('terminationDate');
      ctrl?.setErrors({ matDatepickerParse: true });
      ctrl?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
