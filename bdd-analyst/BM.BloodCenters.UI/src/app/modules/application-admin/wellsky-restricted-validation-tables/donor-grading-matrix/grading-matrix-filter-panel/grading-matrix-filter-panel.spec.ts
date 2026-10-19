import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GradingMatrixFilterPanel } from './grading-matrix-filter-panel';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DonorGradingMatrixFilterValue } from '../models/donor-grading-matrix.model';

describe('GradingMatrixFilterPanel', () => {
  let component: GradingMatrixFilterPanel;
  let fixture: ComponentFixture<GradingMatrixFilterPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradingMatrixFilterPanel],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(GradingMatrixFilterPanel);
    component = fixture.componentInstance;
  });




  it('should emit null for empty fields on apply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');
    component.onApply();
    const emitted = (component.apply.emit as jasmine.Spy).calls.first().args[0] as DonorGradingMatrixFilterValue;
    expect(emitted.firstnameMatch).toBeNull();
    expect(emitted.grade).toBeNull();
  });



  it('should have correct option arrays', () => {
    expect(component.nameMatchOptions.length).toBe(4);
    expect(component.dobMatchOptions.length).toBe(3);
    expect(component.genderMatchOptions.length).toBe(3);
    expect(component.gradeOptions.length).toBe(5);
  });
});
