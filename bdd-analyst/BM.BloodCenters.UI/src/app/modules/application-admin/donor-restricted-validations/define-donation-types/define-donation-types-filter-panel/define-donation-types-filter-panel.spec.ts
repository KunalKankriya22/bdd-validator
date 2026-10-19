import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { DefineDonationTypesFilterPanel } from './define-donation-types-filter-panel';
import { DefineDonationTypesService } from '../services/define-donation-types.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineDonationTypesFilterPanel', () => {
  let component: DefineDonationTypesFilterPanel;
  let fixture: ComponentFixture<DefineDonationTypesFilterPanel>;
  let mockService: jasmine.SpyObj<DefineDonationTypesService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDonationTypesService', ['getDefineDonationTypes']);
    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
imports: [
        DefineDonationTypesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DefineDonationTypesService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {
      mockHeaderService.getCurrentChapterId.calls.reset();
    fixture = TestBed.createComponent(DefineDonationTypesFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should clear form on onClear to null values', () => {
    component.filterForm.patchValue({
      donationTypeCode: 'CODE1',
      sequence: 1,
      effectiveDatePeriod: 'before',
      terminationDatePeriod: 'after'
    });

    component.onClear();

    expect(component.filterForm.value.donationTypeCode).toBeNull();
    expect(component.filterForm.value.sequence).toBeNull();
    expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
    expect(component.filterForm.value.terminationDatePeriod).toBeNull();
  });

  describe('Filter form validation', () => {
    it('should accept valid donation type code from dropdown', () => {
      component.filterForm.patchValue({
        donationTypeCode: 'WB'
      });

      const control = component.filterForm.get('donationTypeCode');
      expect(control?.valid).toBe(true);
    });

    it('should accept valid sequence from dropdown', () => {
      component.filterForm.patchValue({
        sequence: 5
      });

      const control = component.filterForm.get('sequence');
      expect(control?.valid).toBe(true);
    });
  });
  describe('Form initialization with current filters', () => {
    it('should initialize with null when no current filters provided', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.value.donationTypeCode).toBeNull();
      expect(component.filterForm.value.sequence).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
    });

    it('should initialize with null period types when no current filters', () => {
      component.currentFilters = null;
      component.ngOnInit();

      expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
      expect(component.filterForm.value.terminationDatePeriod).toBeNull();
    });

    it('should preserve all filter values on init', () => {
      const effectiveDate = new Date('2024-01-01');
      const terminationDate = new Date('2024-12-31');

      component.currentFilters = {
        donationTypeCode: 'CODE1',
        sequence: 5,
        effectiveDatePeriod: 'before',
        effectiveDate: effectiveDate,
        terminationDatePeriod: 'after',
        terminationDate: terminationDate
      };

      component.ngOnInit();

      expect(component.filterForm.value.donationTypeCode).toBe('CODE1');
      expect(component.filterForm.value.sequence).toBe(5);
      expect(component.filterForm.value.effectiveDatePeriod).toBe('before');
      expect(component.filterForm.value.effectiveDate).toEqual(effectiveDate);
      expect(component.filterForm.value.terminationDatePeriod).toBe('after');
      expect(component.filterForm.value.terminationDate).toEqual(terminationDate);
    });
  });

  describe('Period validation', () => {
    it('should set error on effectiveDatePeriod when effectiveDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01'),
        effectiveDatePeriod: null
      });
      fixture.detectChanges();

      expect(component.effectivePeriodRequired).toBe(true);
    });

    it('should set error on terminationDatePeriod when terminationDate is selected without period', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDate: new Date('2024-12-31'),
        terminationDatePeriod: null
      });
      fixture.detectChanges();

      expect(component.terminationPeriodRequired).toBe(true);
    });




    it('should set effectiveDateRequired when period is selected without date', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        effectiveDatePeriod: 'after',
        effectiveDate: null
      });
      fixture.detectChanges();

      expect(component.effectiveDateRequired).toBe(true);
    });

    it('should set terminationDateRequired when period is selected without date', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        terminationDatePeriod: 'before',
        terminationDate: null
      });
      fixture.detectChanges();

      expect(component.terminationDateRequired).toBe(true);
    });

  });

  describe('Date input handling', () => {
    it('should store raw input text on effective date input', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = 'invalid-date';
      const event = { target: input } as any;

      component.onEffectiveDateInput(event);
      tick();

      expect((component as any).effectiveDateRawInput).toBe('invalid-date');
    }));


    it('should store raw input text on termination date input', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = 'invalid-date';
      const event = { target: input } as any;

      component.onTerminationDateInput(event);
      tick();

      expect((component as any).terminationDateRawInput).toBe('invalid-date');
    }));


    it('should restore effective date raw input on blur', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = 'invalid';
      const inputEvent = { target: input } as any;

      component.onEffectiveDateInput(inputEvent);
      tick();

      // Simulate Material clearing the input
      input.value = '';

      component.onEffectiveDateBlur(input);
      tick();

      expect(input.value).toBe('invalid');
    }));

    it('should restore termination date raw input on blur', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = 'invalid';
      const inputEvent = { target: input } as any;

      component.onTerminationDateInput(inputEvent);
      tick();

      // Simulate Material clearing the input
      input.value = '';

      component.onTerminationDateBlur(input);
      tick();

      expect(input.value).toBe('invalid');
    }));

    it('should not restore effective date input if control has value', fakeAsync(() => {
      component.ngOnInit();
      component.filterForm.patchValue({
        effectiveDate: new Date('2024-01-01')
      });
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = '01-JAN-2024';

      component.onEffectiveDateBlur(input);
      tick();

      // Input should remain as-is since control has value
      expect(input.value).toBe('01-JAN-2024');
    }));

    it('should not restore termination date input if control has value', fakeAsync(() => {
      component.ngOnInit();
      component.filterForm.patchValue({
        terminationDate: new Date('2024-01-01')
      });
      fixture.detectChanges();

      const input = document.createElement('input');
      input.value = '01-JAN-2024';

      component.onTerminationDateBlur(input);
      tick();

      // Input should remain as-is since control has value
      expect(input.value).toBe('01-JAN-2024');
    }));
  });
  describe('Clear functionality', () => {
    it('should reset all form fields on clear', () => {
      component.ngOnInit();

      component.filterForm.patchValue({
        donationTypeCode: 'CODE1',
        sequence: 5,
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2024-12-31')
      });

      component.onClear();

      expect(component.filterForm.value.donationTypeCode).toBeNull();
      expect(component.filterForm.value.sequence).toBeNull();
      expect(component.filterForm.value.effectiveDatePeriod).toBeNull();
      expect(component.filterForm.value.effectiveDate).toBeNull();
      expect(component.filterForm.value.terminationDatePeriod).toBeNull();
      expect(component.filterForm.value.terminationDate).toBeNull();
    });


    it('should reset all validation flags on clear', () => {
      component.ngOnInit();

      component.effectivePeriodRequired = true;
      component.terminationPeriodRequired = true;
      component.effectiveDateRequired = true;
      component.terminationDateRequired = true;

      component.onClear();

      expect(component.effectivePeriodRequired).toBe(false);
      expect(component.terminationPeriodRequired).toBe(false);
      expect(component.effectiveDateRequired).toBe(false);
      expect(component.terminationDateRequired).toBe(false);
    });


  });

  describe('Searchable dropdown functionality', () => {
    beforeEach(() => {
      component.donationTypeCodes = ['WB', 'PLT', 'RBC', 'PLASMA'];
      component.sequences = [1, 2, 3, 10, 20, 30];
    });

    describe('Donation Type Code search', () => {
      it('should initialize with all donation type codes', () => {
        component.ngOnInit();

        expect(component.allDonationTypeCodeOptions).toEqual(['WB', 'PLT', 'RBC', 'PLASMA']);
        expect(component.filteredDonationTypeCodeOptions).toEqual(['WB', 'PLT', 'RBC', 'PLASMA']);
      });

      it('should filter donation type codes based on search text', fakeAsync(() => {
        component.ngOnInit();

        component.donationTypeCodeSearchControl.setValue('PL');
        tick(300);

        expect(component.filteredDonationTypeCodeOptions).toEqual(['PLT', 'PLASMA']);
      }));

      it('should filter donation type codes case-insensitively', fakeAsync(() => {
        component.ngOnInit();

        component.donationTypeCodeSearchControl.setValue('wb');
        tick(300);

        expect(component.filteredDonationTypeCodeOptions).toEqual(['WB']);
      }));


      it('should debounce search input', fakeAsync(() => {
        component.ngOnInit();
        spyOn(component['cdr'], 'markForCheck');

        component.donationTypeCodeSearchControl.setValue('P');
        tick(100);
        expect(component.filteredDonationTypeCodeOptions).toEqual(['WB', 'PLT', 'RBC', 'PLASMA']);

        tick(200);
        expect(component.filteredDonationTypeCodeOptions).toEqual(['PLT', 'PLASMA']);
      }));



      it('should handle null search value', fakeAsync(() => {
        component.ngOnInit();

        component.donationTypeCodeSearchControl.setValue(null);
        tick(300);

        expect(component.filteredDonationTypeCodeOptions).toEqual(['WB', 'PLT', 'RBC', 'PLASMA']);
      }));
    });

    describe('Sequence search', () => {
      it('should initialize with all sequences', () => {
        component.ngOnInit();

        expect(component.allSequenceOptions).toEqual([1, 2, 3, 10, 20, 30]);
        expect(component.filteredSequenceOptions).toEqual([1, 2, 3, 10, 20, 30]);
      });

      it('should filter sequences based on search text', fakeAsync(() => {
        component.ngOnInit();

        component.sequenceSearchControl.setValue('1');
        tick(300);

        expect(component.filteredSequenceOptions).toEqual([1, 10]);
      }));

      it('should filter sequences with partial match', fakeAsync(() => {
        component.ngOnInit();

        component.sequenceSearchControl.setValue('2');
        tick(300);

        expect(component.filteredSequenceOptions).toEqual([2, 20]);
      }));


      it('should debounce sequence search input', fakeAsync(() => {
        component.ngOnInit();

        component.sequenceSearchControl.setValue('1');
        tick(100);
        expect(component.filteredSequenceOptions).toEqual([1, 2, 3, 10, 20, 30]);

        tick(200);
        expect(component.filteredSequenceOptions).toEqual([1, 10]);
      }));



      it('should handle null sequence search value', fakeAsync(() => {
        component.ngOnInit();

        component.sequenceSearchControl.setValue(null);
        tick(300);

        expect(component.filteredSequenceOptions).toEqual([1, 2, 3, 10, 20, 30]);
      }));
    });
  });

  describe('Component lifecycle', () => {
    it('should cleanup subscriptions on destroy', () => {
      component.ngOnInit();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });


  });
});
