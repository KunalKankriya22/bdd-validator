import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditInterdictionPanel } from './edit-interdiction-panel';
import { GroupInterdictionApiService } from '../services/group-interdiction-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidInterdictionDto,
  InterdictionDto,
  PlaceGroupInterdictionResultDto,
} from '../models/group-interdiction.model';

describe('EditInterdictionPanel', () => {
  let component: EditInterdictionPanel;
  let fixture: ComponentFixture<EditInterdictionPanel>;
  let apiServiceSpy: jasmine.SpyObj<GroupInterdictionApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let comp: any;

  const mockActiveInterdictions: ValidInterdictionDto[] = [
    { interCode: 'CODE1', interDesc: 'Test Interdiction 1', interType: 'NFT' },
    { interCode: 'CODE2', interDesc: 'Test Interdiction 2', interType: 'HOLD' },
  ];

  const mockInterdiction: InterdictionDto = {
    interCode: 'CODE1',
    interDesc: 'Test Interdiction 1',
    interType: 'NFT',
  };

  const mockResult: PlaceGroupInterdictionResultDto = {
    controlMode: 'DRIVE',
    selectionValue: 'DRIVE1',
    interdictionsPlaced: 1,
    message: 'Successfully placed interdiction',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('GroupInterdictionApiService', ['placeInterdictions']);
    snackbarServiceSpy = createMockSnackbarService();

    apiServiceSpy.placeInterdictions.and.returnValue(of(mockResult));



      TestBed.configureTestingModule({
      imports: [EditInterdictionPanel, NoopAnimationsModule],
      providers: [
        { provide: GroupInterdictionApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });


    


      apiServiceSpy.placeInterdictions.calls.reset();


      apiServiceSpy.placeInterdictions.and.returnValue(of(mockResult));


    fixture = TestBed.createComponent(EditInterdictionPanel);
    component = fixture.componentInstance;
    comp = component as any;

    // Set required inputs
    fixture.componentRef.setInput('interdiction', mockInterdiction);
    fixture.componentRef.setInput('activeInterdictions', mockActiveInterdictions);
    fixture.componentRef.setInput('controlMode', 'DRIVE');
    fixture.componentRef.setInput('selectionValue', 'DRIVE1');

    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize form with current interdiction code', () => {
      expect(component.form.get('interdictionCode')?.value).toBe('CODE1');
    });

    it('should set selected interdiction on init', () => {
      expect(comp.selectedInterdiction()).toEqual(mockActiveInterdictions[0]);
    });


  });

  describe('Form Validation', () => {
    it('should require interdiction code', () => {
      const codeControl = component.form.get('interdictionCode');
      codeControl?.setValue(null);

      expect(codeControl?.hasError('required')).toBeTrue();
    });


  });

  describe('Interdiction Selection', () => {
    it('should update selected interdiction when code changes', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE2');
      tick();

      expect(comp.selectedInterdiction()).toEqual(mockActiveInterdictions[1]);
    }));

    it('should display updated description when code changes', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE2');
      tick();
      fixture.detectChanges();

      const description = fixture.debugElement.query(By.css('.field-label .value'));
      expect(description.nativeElement.textContent.trim()).toBe('Test Interdiction 2');
    }));

    it('should display updated type when code changes', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE2');
      tick();
      fixture.detectChanges();

      const labels = fixture.debugElement.queryAll(By.css('.field-label .value'));
      expect(labels[1].nativeElement.textContent.trim()).toBe('HOLD');
    }));
  });

  describe('Save Functionality', () => {


    it('should call API service when code is changed', fakeAsync(() => {
      component.form.get('interdictionCode')?.setValue('CODE2');

      comp.onSave();
      tick();

      expect(apiServiceSpy.placeInterdictions).toHaveBeenCalledWith({
        controlMode: 'DRIVE',
        selectionValue: 'DRIVE1',
        interdictionCodes: ['CODE2'],
      });
    }));









    it('should handle API error with default message', fakeAsync(() => {
      apiServiceSpy.placeInterdictions.and.returnValue(throwError(() => new Error('Unknown error')));
      component.form.get('interdictionCode')?.setValue('CODE2');

      comp.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update interdiction.');
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
