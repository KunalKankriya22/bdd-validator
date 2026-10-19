import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssignUserInterdictionFilterPanel } from './assign-user-interdiction-filter-panel';
import { AssignUserInterdictionClassService } from '../services/assign-user-interdiction-class.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';

describe('AssignUserInterdictionFilterPanel', () => {
  let serviceSpy: any;
  let component: AssignUserInterdictionFilterPanel;
  let fixture: ComponentFixture<AssignUserInterdictionFilterPanel>;
  let service: jasmine.SpyObj<AssignUserInterdictionClassService>;

  const mockInterdictionClasses = [
    { code: 'SYS', description: 'System Interdictions' },
    { code: 'LAB', description: 'Lab Interdictions' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('AssignUserInterdictionClassService', [
      'getInterdictionClasses'
    ]);



      TestBed.configureTestingModule({
imports: [AssignUserInterdictionFilterPanel, HttpClientTestingModule],
      providers: [
        { provide: AssignUserInterdictionClassService, useValue: serviceSpy }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getInterdictionClasses.calls.reset();


    fixture = TestBed.createComponent(AssignUserInterdictionFilterPanel);
    component = fixture.componentInstance;
    service = TestBed.inject(AssignUserInterdictionClassService) as jasmine.SpyObj<AssignUserInterdictionClassService>;
    service.getInterdictionClasses.and.returnValue(of(mockInterdictionClasses));


    });

  it('should load interdiction classes on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(service.getInterdictionClasses).toHaveBeenCalled();
    expect(component.interdictionClassOptions.length).toBe(2);
  }));



  it('should convert moment dates to UTC when applying filters', () => {
    const momentDate = moment('2024-02-15');
    const utcDate = component['convertToUTCDate'](momentDate.toDate());

    expect(utcDate).toBeTruthy();
    expect(utcDate!.getUTCDate()).toBe(15);
    expect(utcDate!.getUTCMonth()).toBe(1);
    expect(utcDate!.getUTCHours()).toBe(0);
  });

  it('should emit apply event with UTC dates', fakeAsync(() => {
    spyOn(component.apply, 'emit');
    fixture.detectChanges();

    component.filterForm.patchValue({
      interClass: 'SYS',
      effectiveDatePeriod: 'After',
      effectiveDate: moment('2024-01-15').toDate()
    });

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalled();
    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.interClass).toBe('SYS');
    expect(emittedValue.effectiveDate).toBeTruthy();
  }));




  it('should handle API error when loading classes', fakeAsync(() => {
    service.getInterdictionClasses.and.returnValue(throwError(() => ({ message: 'Error' })));
    spyOn(console, 'error');

    component.ngOnInit();
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.isLoadingFilters).toBe(false);
    expect(component.interdictionClassOptions).toEqual([]);
  }));

  it('should preserve date when converting to UTC', () => {
    const momentDate = moment('2024-12-31');
    const utcDate = component['convertToUTCDate'](momentDate.toDate());

    expect(utcDate!.getUTCDate()).toBe(31);
    expect(utcDate!.getUTCMonth()).toBe(11);
    expect(utcDate!.getUTCFullYear()).toBe(2024);
  });

  it('should emit filters with null values when form is empty', () => {
    spyOn(component.apply, 'emit');
    fixture.detectChanges();

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalled();
    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emittedValue.interClass).toBeNull();
    expect(emittedValue.effectiveDate).toBeNull();
  });
});
