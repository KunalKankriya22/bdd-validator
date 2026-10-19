import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AddInterdictionPanel } from './add-interdiction-panel';
import { GroupInterdictionApiService } from '../services/group-interdiction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  ValidInterdictionDto,
  InterdictionDto,
  PlaceGroupInterdictionResultDto,
} from '../models/group-interdiction.model';
import { ComponentFixtureAutoDetect } from '@angular/core/testing';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AddInterdictionPanel', () => {
  let component: AddInterdictionPanel;
  let fixture: ComponentFixture<AddInterdictionPanel>;
  let apiServiceSpy: jasmine.SpyObj<GroupInterdictionApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let comp: any;

  const mockActiveInterdictions: ValidInterdictionDto[] = [
    { interCode: 'CODE1', interDesc: 'Test Interdiction 1', interType: 'NFT' },
    { interCode: 'CODE2', interDesc: 'Test Interdiction 2', interType: 'HOLD' },
  ];

  const mockResult: PlaceGroupInterdictionResultDto = {
    controlMode: 'DRIVE',
    selectionValue: 'DRIVE1',
    interdictionsPlaced: 5,
    message: 'Successfully placed 5 interdictions',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('GroupInterdictionApiService', ['placeInterdictions']);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.placeInterdictions.and.returnValue(of(mockResult));



      TestBed.configureTestingModule({
      imports: [AddInterdictionPanel, NoopAnimationsModule],
      providers: [
        { provide: GroupInterdictionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ],
    });


    


      apiServiceSpy.placeInterdictions.calls.reset();


      apiServiceSpy.placeInterdictions.and.returnValue(of(mockResult));


    fixture = TestBed.createComponent(AddInterdictionPanel);
    component = fixture.componentInstance;
    comp = component as any;

    // Set required inputs
    fixture.componentRef.setInput('activeInterdictions', mockActiveInterdictions);
    fixture.componentRef.setInput('controlMode', 'DRIVE');
    fixture.componentRef.setInput('selectionValue', 'DRIVE1');

    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize form with null interdiction code', () => {
      expect(component.form.get('interdictionCode')?.value).toBeNull();
    });


  });

  describe('Form Validation', () => {
    it('should require interdiction code', () => {
      const codeControl = component.form.get('interdictionCode');
      expect(codeControl?.hasError('required')).toBeTrue();

      codeControl?.setValue('CODE1');
      expect(codeControl?.hasError('required')).toBeFalse();
    });




  });

  describe('Interdiction Selection', () => {
    it('should update selected interdiction when code changes', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();

      expect(comp.selectedInterdiction()).toEqual(mockActiveInterdictions[0]);
    }));

    it('should display description when interdiction is selected', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('.field-label .value'));
      expect(description.nativeElement.textContent.trim()).toBe('Test Interdiction 1');
    }));

    it('should display type when interdiction is selected', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();
      fixture.detectChanges();

      const labels = fixture.debugElement.queryAll(By.css('.field-label .value'));
      expect(labels[1].nativeElement.textContent.trim()).toBe('NFT');
    }));

    it('should clear selected interdiction when code is cleared', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
      tick();
      expect(comp.selectedInterdiction()).toBeTruthy();

      component.form.get('interdictionCode')?.setValue(null);
      tick();
      expect(comp.selectedInterdiction()).toBeNull();
    }));
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
    });

    it('should call API service when adding interdiction', fakeAsync(() => {
      comp.onAdd();
      tick();

      expect(apiServiceSpy.placeInterdictions).toHaveBeenCalledWith({
        controlMode: 'DRIVE',
        selectionValue: 'DRIVE1',
        collectionDate: undefined,
        interdictionCodes: ['CODE1'],
      });
    }));










  });

  describe('Add and Create Another', () => {
    beforeEach(() => {
      component.form.get('interdictionCode')?.setValue('CODE1');
    });

    it('should reset form after successful add and create another', fakeAsync(() => {
      comp.onAddAndCreateAnother();
      tick();

      expect(component.form.get('interdictionCode')?.value).toBeNull();
      expect(comp.submitted()).toBeFalse();
      expect(comp.selectedInterdiction()).toBeNull();
    }));



    it('should keep panel open after successful add and create another', fakeAsync(() => {
      comp.onAddAndCreateAnother();
      tick();

      expect(component.form).toBeTruthy();
      expect(comp.loading()).toBeFalse();
    }));
  });
  describe('Loading State', () => {


    it('should disable save button while loading', () => {
      comp.loading.set(true);
      fixture.detectChanges();

      expect(comp.canSave()).toBeFalse();
    });


  });
});
