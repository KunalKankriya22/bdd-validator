import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ResourceFilterComponent, ResourceFilter } from './resource-filter';

describe('ResourceFilterComponent', () => {
  let component: ResourceFilterComponent;
  let fixture: ComponentFixture<ResourceFilterComponent>;

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [ResourceFilterComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(ResourceFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  it('should initialize filterForm with four controls', () => {
    expect(component.filterForm.contains('effectiveDatePeriod')).toBeTrue();
    expect(component.filterForm.contains('effectiveDate')).toBeTrue();
    expect(component.filterForm.contains('terminationDatePeriod')).toBeTrue();
    expect(component.filterForm.contains('terminationDate')).toBeTrue();
  });

  describe('Input Handling', () => {
    it('should populate form from currentFilters input on init', () => {
      const filters: ResourceFilter = {
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(),
        terminationDatePeriod: null,
        terminationDate: null
      };

      const newFixture = TestBed.createComponent(ResourceFilterComponent);
      const newComponent = newFixture.componentInstance;
      newComponent.currentFilters = filters;
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('effectiveDatePeriod')?.value).toBe('AFTER');
    });

    it('should leave form empty when no currentFilters provided', () => {
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    });
  });
  describe('onClear', () => {
    it('should reset all form controls to null', () => {
      component.filterForm.patchValue({
        effectiveDatePeriod: 'AFTER',
        effectiveDate: new Date(),
        terminationDatePeriod: 'BEFORE',
        terminationDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should reset period validation flags', () => {
      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;

      component.onClear();

      expect(component.effectivePeriodRequired).toBeFalse();
      expect(component.terminationPeriodRequired).toBeFalse();
    });
  });
  describe('isApplyDisabled', () => {
    it('should return true when no date values are set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

  });

  describe('Period Validation', () => {
    it('should set effectivePeriodRequired when date set without period', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      tick(0);

      expect(component.effectivePeriodRequired).toBeTrue();
    }));

    it('should clear effectivePeriodRequired when period is set', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      tick(0);
      expect(component.effectivePeriodRequired).toBeTrue();

      component.filterForm.get('effectiveDatePeriod')?.setValue('AFTER');
      tick(0);
      expect(component.effectivePeriodRequired).toBeFalse();
    }));
  });
});
