import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { HlaInterimOutputFilterPanel } from './hla-interim-output-filter-panel';
import { HlaInterimOutputSearchParams, DropdownOption } from '../models/hla-interim-output.model';

describe('HlaInterimOutputFilterPanel', () => {
  let component: HlaInterimOutputFilterPanel;
  let fixture: ComponentFixture<HlaInterimOutputFilterPanel>;

  const mockInterimCodeOptions: DropdownOption[] = [
    { value: '01', label: '01 - HLA-A*01' },
    { value: '02', label: '02 - HLA-A*02' },
    { value: '03', label: '03 - HLA-B*03' }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        HlaInterimOutputFilterPanel,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        NgxMatSelectSearchModule
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(HlaInterimOutputFilterPanel);
    component = fixture.componentInstance;
    component.matchA1A1Options = mockInterimCodeOptions;
    component.matchA1A2Options = mockInterimCodeOptions;
    component.matchA2A1Options = mockInterimCodeOptions;
    component.matchA2A2Options = mockInterimCodeOptions;
    component.outcomeAntigenA1Options = mockInterimCodeOptions;
    component.outcomeAntigenA2Options = mockInterimCodeOptions;


    });


  it('should populate form with current filters', () => {
    const currentFilters: HlaInterimOutputSearchParams = {
      matchA1A1: '01',
      matchA1A2: '02',
      outcomeAntigenA1: '01'
    };
    component.currentFilters = currentFilters;

    fixture.detectChanges();

    expect(component.filterForm.get('matchA1A1')?.value).toBe('01');
    expect(component.filterForm.get('matchA1A2')?.value).toBe('02');
    expect(component.filterForm.get('outcomeAntigenA1')?.value).toBe('01');
  });


  it('should not include null values in applied filters', () => {
    spyOn(component.apply, 'emit');
    fixture.detectChanges();

    component.filterForm.patchValue({
      matchA1A1: '01',
      matchA1A2: null,
      outcomeAntigenA1: '01'
    });

    component.onApply();

    const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedFilters.matchA1A1).toBe('01');
    expect(emittedFilters.matchA1A2).toBeUndefined();
    expect(emittedFilters.outcomeAntigenA1).toBe('01');
  });






  it('should perform case-insensitive search', () => {
    fixture.detectChanges();

    component.matchA1A1SearchControl.setValue('hla-a');
    fixture.detectChanges();

    const options = component.filteredMatchA1A1Options();
    expect(options.length).toBeGreaterThan(0);
    expect(options.every(opt => opt.label.toLowerCase().includes('hla-a'))).toBe(true);
  });


  it('should update filtered options when matchA1A1Options changes', () => {
    fixture.detectChanges();

    const newOptions = [
      { value: '04', label: '04 - HLA-C*04' }
    ];

    component.matchA1A1Options = newOptions;
    component.ngOnChanges({
      matchA1A1Options: {
        currentValue: newOptions,
        previousValue: mockInterimCodeOptions,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    const options = component.filteredMatchA1A1Options();
    expect(options).toEqual(newOptions);
  });
});
