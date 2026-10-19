import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import moment from 'moment';

import { HoldDetailsFilterPanelComponent } from './hold-details-filter-panel';
import { HeaderService } from '@shared/services/header.service';

describe('HoldDetailsFilterPanelComponent', () => {
  let component: HoldDetailsFilterPanelComponent;
  let fixture: ComponentFixture<HoldDetailsFilterPanelComponent>;
  let mockHeaderService: { chapterChanged$: Subject<void> };

  beforeEach(() => {

    mockHeaderService = {
      chapterChanged$: new Subject<void>(),
    };



      TestBed.configureTestingModule({
      imports: [HoldDetailsFilterPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
      ],
    });


    



    fixture = TestBed.createComponent(HoldDetailsFilterPanelComponent);
    component = fixture.componentInstance;


    });

  describe('Component Creation', () => {


    it('should use Component suffix in class name', () => {
      expect(component.constructor.name).toBe('HoldDetailsFilterPanelComponent');
    });
  });

  describe('Initialization', () => {


    it('should populate unit hold options by default', () => {
      fixture.detectChanges();
      expect(component.holdOptions.length).toBeGreaterThan(0);
      expect(component.holdOptions.some(o => o.value === 'Active')).toBeTrue();
    });

    it('should populate donor hold options when section is donor', () => {
      component.section = 'donor';
      fixture.detectChanges();
      expect(component.holdOptions.some(o => o.value === 'ActiveDonation')).toBeTrue();
    });


  });
  describe('Hold Search with Debounce (L5)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter hold options after debounce delay', fakeAsync(() => {
      component.holdSearchControl.setValue('Active');
      tick(200);
      expect(component.filteredHoldOptions.length).toBeGreaterThan(0);
      component.filteredHoldOptions.forEach(o => {
        expect(
          o.label.toLowerCase().includes('active') || o.value.toLowerCase().includes('active')
        ).toBeTrue();
      });
    }));

    it('should show all options when search is cleared', fakeAsync(() => {
      component.holdSearchControl.setValue('Active');
      tick(200);
      component.holdSearchControl.setValue('');
      tick(200);
      expect(component.filteredHoldOptions.length).toBe(component.holdOptions.length);
    }));
  });

  describe('No Unused ViewChild Refs (L4)', () => {
    it('should not have entryDateInput ViewChild', () => {
      fixture.detectChanges();
      expect((component as any).entryDateInput).toBeUndefined();
    });

    it('should not have terminationDateInput ViewChild', () => {
      fixture.detectChanges();
      expect((component as any).terminationDateInput).toBeUndefined();
    });
  });

  describe('Period Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set entryDatePeriodError when date is set but period is not', () => {
      component.filterForm.get('entryDate')?.setValue(moment());
      expect(component.entryDatePeriodError).toBe('Period is required');
    });

    it('should clear entryDatePeriodError when both date and period are set', () => {
      component.filterForm.get('entryDate')?.setValue(moment());
      component.filterForm.get('entryDatePeriod')?.setValue('after');
      expect(component.entryDatePeriodError).toBe('');
    });

    it('should set terminationDatePeriodError when date is set but period is not', () => {
      component.filterForm.get('terminationDate')?.setValue(moment());
      expect(component.terminationDatePeriodError).toBe('Period is required');
    });

    it('should clear terminationDatePeriodError when both date and period are set', () => {
      component.filterForm.get('terminationDate')?.setValue(moment());
      component.filterForm.get('terminationDatePeriod')?.setValue('before');
      expect(component.terminationDatePeriodError).toBe('');
    });
  });

  describe('Apply / Clear / Close', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable apply when no filters are set', () => {
      expect(component.isApplyDisabled).toBeTrue();
    });

    it('should enable apply when holds filter is set', () => {
      component.filterForm.get('holds')?.setValue('Active');
      expect(component.isApplyDisabled).toBeFalse();
    });

    it('should disable apply when period error exists', () => {
      component.filterForm.get('entryDate')?.setValue(moment());
      expect(component.isApplyDisabled).toBeTrue();
    });






  });

});
