import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HHResponseFilterPanel } from './hh-response-filter-panel';

describe('HHResponseFilterPanel', () => {
  let component: HHResponseFilterPanel;
  let fixture: ComponentFixture<HHResponseFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HHResponseFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HHResponseFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize filter form with responseCode control', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('responseCode')).toBeDefined();
  });

  it('should populate form from current filters', () => {
    component.currentFilters = {
      responseCode: 'Y'
    };
    component.ngOnInit();

    expect(component.filterForm.value.responseCode).toBe('Y');
  });




});
