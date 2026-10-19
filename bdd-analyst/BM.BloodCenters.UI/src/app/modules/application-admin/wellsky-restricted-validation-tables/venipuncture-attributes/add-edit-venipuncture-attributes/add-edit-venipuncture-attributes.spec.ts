import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AddEditVenipunctureAttributes } from './add-edit-venipuncture-attributes';
import { VenipunctureAttributesService } from '../services/venipuncture-attributes.service';
import { HeaderService } from '@shared/services/header.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

describe('AddEditVenipunctureAttributes', () => {
  let serviceSpy: any;
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: AddEditVenipunctureAttributes;
  let fixture: ComponentFixture<AddEditVenipunctureAttributes>;
  let service: jasmine.SpyObj<VenipunctureAttributesService>;
  let mockHeaderService: { chapterTimeZone: ReturnType<typeof signal<string>> };

  const mockGroups = [
    { groupName: 'GRP01', groupDesc: 'Group 01' },
    { groupName: 'GRP02', groupDesc: 'Group 02' }
  ];

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('VenipunctureAttributesService', [
      'getVenipunctureAttributesGroups',
      'addVenipunctureAttribute',
      'updateVenipunctureAttribute'
    ]);
    serviceSpy.getVenipunctureAttributesGroups.and.returnValue(of(mockGroups));

    mockHeaderService = { chapterTimeZone: signal('+00:00') };



      TestBed.configureTestingModule({
imports: [AddEditVenipunctureAttributes],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimations(),
        { provide: VenipunctureAttributesService, useValue: serviceSpy },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    });



  beforeEach(() => {


      serviceSpy.getVenipunctureAttributesGroups.calls.reset();


      serviceSpy.addVenipunctureAttribute.calls.reset();


      serviceSpy.updateVenipunctureAttribute.calls.reset();


      serviceSpy.getVenipunctureAttributesGroups.and.returnValue(of(mockGroups));


    fixture = TestBed.createComponent(AddEditVenipunctureAttributes);
    component = fixture.componentInstance;
    service = TestBed.inject(VenipunctureAttributesService) as jasmine.SpyObj<VenipunctureAttributesService>;
    fixture.detectChanges();


    });




  describe('Date Error Messages', () => {
    it('should return effective date required error', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });


  });

  describe('Date Input Handlers', () => {
    it('should set invalidDate error on effective date when invalid text is typed', () => {
      const control = component.form.get('effectiveDate');
      const inputEl = document.createElement('input');
      inputEl.value = 'INVALID_DATE';
      const event = { target: inputEl } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(control?.hasError('invalidDate')).toBeTrue();
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });

    it('should set required error on effective date when input is cleared', () => {
      const control = component.form.get('effectiveDate');
      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = { target: inputEl } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(control?.hasError('required')).toBeTrue();
    });

    it('should set invalidDate error on termination date when invalid text is typed', () => {
      const control = component.form.get('terminationDate');
      const inputEl = document.createElement('input');
      inputEl.value = 'FSDFSDFDFFDS';
      const event = { target: inputEl } as unknown as Event;

      component.onTerminationDateInput(event);

      expect(control?.hasError('invalidDate')).toBeTrue();
      expect(control?.touched).toBeTrue();
      expect(control?.dirty).toBeTrue();
    });


    it('should mark termination date as dirty when input is cleared in edit mode', () => {
      const control = component.form.get('terminationDate');

      const inputEl = document.createElement('input');
      inputEl.value = '';
      const event = { target: inputEl } as unknown as Event;

      component.mode = 'edit';
      component.onTerminationDateInput(event);

      expect(control?.dirty).toBeTrue();
    });

  });

  describe('isFormValid - Edit Mode with Past Termination Date', () => {
    it('should allow save button when other fields are changed even if termination date is in past', () => {
      component.mode = 'edit';
      component.data = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date('2020-01-01'),
        terminationDate: new Date('2021-01-01')
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('description')?.setValue('Updated Description');
      component.form.get('description')?.markAsDirty();

      expect(component.isFormValid).toBeTrue();
    });

    it('should block save and show error when termination date is in past', () => {
      component.mode = 'edit';
      component.data = {
        group: 'VENI',
        code: '01',
        description: 'Test',
        effectiveDate: new Date('2020-01-01'),
        terminationDate: new Date('2021-01-01')
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('description')?.setValue('Updated Description');
      component.form.get('description')?.markAsDirty();

      component.onSave();

      expect(service.updateVenipunctureAttribute).not.toHaveBeenCalled();
      expect(component.getTerminationDateError()).toContain('past');
    });


  });
});
