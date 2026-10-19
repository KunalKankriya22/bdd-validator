import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ViewAssociatedInterdictionComponent } from './view-associated-interdiction';
import {
  ViewAssociatedInterdictionService,
  AssociatedInterdiction,
} from './services/view-associated-interdiction.service';

describe('ViewAssociatedInterdictionComponent', () => {
  let component: ViewAssociatedInterdictionComponent;
  let fixture: ComponentFixture<ViewAssociatedInterdictionComponent>;
  let service: jasmine.SpyObj<ViewAssociatedInterdictionService>;

  beforeEach(() => {

    service = jasmine.createSpyObj<ViewAssociatedInterdictionService>(
      'ViewAssociatedInterdictionService',
      ['getAssociatedInterdictions']
    );



      TestBed.configureTestingModule({
      imports: [ViewAssociatedInterdictionComponent], // standalone
      providers: [{ provide: ViewAssociatedInterdictionService, useValue: service }],
    });


    



    fixture = TestBed.createComponent(ViewAssociatedInterdictionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  /*  BASIC */


  it('should initialize with empty interdictions and loading false', () => {
    expect(component.interdictions).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });



  /*  ngOnChanges + API SUCCESS */

  it('should call API and populate interdictions when panel opens', () => {
    const mockResponse: AssociatedInterdiction[] = [
      {
        code: 'B',
        type: 'T1',
        description: 'Desc B',
        level: 1,
        effectiveDate: '2024-01-01',
      },
      {
        code: 'A',
        type: 'T2',
        description: 'Desc A',
        level: 2,
        effectiveDate: '2024-01-02',
      },
    ];

    service.getAssociatedInterdictions.and.returnValue(of(mockResponse));

    component.accessClassCode = 'AC001';
    component.isOpen = true;

    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, false),
    });

    expect(service.getAssociatedInterdictions).toHaveBeenCalledOnceWith('AC001');
    expect(component.isLoading).toBeFalse();
    expect(component.interdictions).toEqual(mockResponse);
  });

  /* ngOnChanges + API ERROR  */

  it('should reset interdictions and loading flag on API error', () => {
    service.getAssociatedInterdictions.and.returnValue(
      throwError(() => new Error('API error'))
    );

    component.accessClassCode = 'AC001';
    component.isOpen = true;
    component.interdictions = [
      {
        code: 'X',
        type: 'T',
        description: 'Old',
        level: 1,
        effectiveDate: '2024-01-01',
      },
    ];

    component.ngOnChanges({
      isOpen: new SimpleChange(false, true, false),
    });

    expect(component.interdictions).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  /* GUARD CASE  */



  /* SORTING */

  it('should sort interdictions by code asc and desc when toggleCodeSort is called', () => {
    component.interdictions = [
      { code: 'b', type: 'T', description: '', level: 1, effectiveDate: '' },
      { code: 'a', type: 'T', description: '', level: 1, effectiveDate: '' },
      { code: 'c', type: 'T', description: '', level: 1, effectiveDate: '' },
    ];

    // first toggle → desc
    component.codeSortDirection = 'asc';
    component.toggleCodeSort();

    expect(component.codeSortDirection).toBe('desc');
    expect(component.interdictions.map(i => i.code)).toEqual(['c', 'b', 'a']);

    component.toggleCodeSort();

    expect(component.codeSortDirection).toBe('asc');
    expect(component.interdictions.map(i => i.code)).toEqual(['a', 'b', 'c']);
  });
});
