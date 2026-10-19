import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MormFilterPanel } from './morm-filter-panel';

describe('MormFilterPanel', () => {
  let component: MormFilterPanel;
  let fixture: ComponentFixture<MormFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MormFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(MormFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    fixture.detectChanges();

    expect(component.form.get('testId')?.value).toBe('');
    expect(component.form.get('testType')?.value).toBe('');
    expect(component.form.get('testIntp')?.value).toBe('');
    expect(component.form.get('includeInactive')?.value).toBeFalse();
  });

  it('should patch form with currentFilters on ngOnInit', () => {
    component.currentFilters = {
      testId: 'T1',
      testType: 'TT1',
      testIntp: 'TI1',
      includeInactive: true
    };
    fixture.detectChanges();

    expect(component.form.get('testId')?.value).toBe('T1');
    expect(component.form.get('testType')?.value).toBe('TT1');
    expect(component.form.get('includeInactive')?.value).toBeTrue();
  });

  it('should emit apply event with only non-empty filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.form.patchValue({ testId: ' ABC ', testType: '', includeInactive: false });
    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.testId).toBe('ABC');
    expect(emitted.testType).toBeUndefined();
    expect(emitted.includeInactive).toBeUndefined();
  });

  it('should emit apply with includeInactive when checked', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.form.patchValue({ includeInactive: true });
    component.onApply();

    const emitted = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.includeInactive).toBeTrue();
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.form.patchValue({ testId: 'X', includeInactive: true });

    component.onClear();

    expect(component.form.get('testId')?.value).toBe('');
    expect(component.form.get('includeInactive')?.value).toBeFalse();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should expose form controls via f getter', () => {
    fixture.detectChanges();

    expect(component.f['testId']).toBeDefined();
    expect(component.f['testType']).toBeDefined();
    expect(component.f['testIntp']).toBeDefined();
    expect(component.f['includeInactive']).toBeDefined();
  });

  it('should emit empty filter object when all fields are empty', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({});
  });
});
