import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterdictionsFilterPanel } from './interdictions-filter-panel';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InterdictionsFilterValue } from '../models/user-access-filters.model';

describe('InterdictionsFilterPanel', () => {
  let component: InterdictionsFilterPanel;
  let fixture: ComponentFixture<InterdictionsFilterPanel>;

  const mockCurrentFilters: InterdictionsFilterValue = {
    interdictionsType: 'INTER',
    interdictionsCode: '102A'
  };

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        InterdictionsFilterPanel]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(InterdictionsFilterPanel);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {


    it('should have predefined interdictionsTypeOptions', () => {
      expect(component.interdictionsTypeOptions).toEqual(['INTER']);
    });

    it('should have predefined interdictionsCodeOptions', () => {
      expect(component.interdictionsCodeOptions).toEqual(['101B', '101C', '101E', '102A', '103B', '104C', '105D']);
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should reset all fields to null', () => {
      component.filterForm.patchValue({
        interdictionsType: 'INTER',
        interdictionsCode: '101E'
      });

      component.onClear();

      const formValue = component.filterForm.value;
      expect(formValue.interdictionsType).toBeNull();
      expect(formValue.interdictionsCode).toBeNull();
    });
  });
  describe('Filter Form Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should handle partial form values', () => {
      component.filterForm.patchValue({
        interdictionsCode: '103B'
      });

      const formValue = component.filterForm.value;

      expect(formValue.interdictionsCode).toBe('103B');
      expect(formValue.interdictionsType).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow selecting and applying filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        interdictionsType: 'INTER',
        interdictionsCode: '101C'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        interdictionsType: 'INTER',
        interdictionsCode: '101C'
      }));
    });

    it('should allow clearing and reselecting filters', () => {
      component.filterForm.patchValue({
        interdictionsType: 'INTER',
        interdictionsCode: '105D'
      });

      component.onClear();

      expect(component.filterForm.get('interdictionsType')?.value).toBeNull();
      expect(component.filterForm.get('interdictionsCode')?.value).toBeNull();

      component.filterForm.patchValue({
        interdictionsType: 'INTER',
        interdictionsCode: '101B'
      });

      expect(component.filterForm.get('interdictionsType')?.value).toBe('INTER');
      expect(component.filterForm.get('interdictionsCode')?.value).toBe('101B');
    });

    it('should handle multiple interdiction code selections', () => {
      const codes = ['101B', '102A', '103B', '104C'];

      codes.forEach(code => {
        component.filterForm.patchValue({
          interdictionsCode: code
        });

        expect(component.filterForm.get('interdictionsCode')?.value).toBe(code);
      });
    });
  });

  describe('Filter Options', () => {


    it('should contain all expected interdiction codes', () => {
      const expectedCodes = ['101B', '101C', '101E', '102A', '103B', '104C', '105D'];
      expectedCodes.forEach(code => {
        expect(component.interdictionsCodeOptions).toContain(code);
      });
    });
  });
});
