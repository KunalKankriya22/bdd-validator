import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AddEditNotationCodeComponent } from './add-edit-notation-code';
import { NotationCodeTableModel } from '../models/notation-code.model';
import { HeaderService } from '@shared/services/header.service';
import { NotationCodeApiService } from '../services/notation-code-api.service';
import moment from 'moment';

describe('AddEditNotationCodeComponent', () => {
  let component: AddEditNotationCodeComponent;
  let fixture: ComponentFixture<AddEditNotationCodeComponent>;

  beforeEach(() => {

    const headerServiceMock = {
      chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue(''),
      chapterChanged$: of(void 0)
    };
    const apiServiceMock = {
      getValidTests: jasmine.createSpy('getValidTests').and.returnValue(of([]))
    };



      TestBed.configureTestingModule({
      imports: [AddEditNotationCodeComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: NotationCodeApiService, useValue: apiServiceMock }
      ]
    });


    



    fixture = TestBed.createComponent(AddEditNotationCodeComponent);
    component = fixture.componentInstance;


    });


  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should mark notation code as required', () => {
      const notationCodeControl = component.form.get('notationCode');
      notationCodeControl?.markAsTouched();
      expect(notationCodeControl?.hasError('required')).toBe(true);
    });



    it('should validate notation code max length', () => {
      const notationCodeControl = component.form.get('notationCode');
      notationCodeControl?.setValue('12345678901');
      expect(notationCodeControl?.hasError('maxlength')).toBe(true);
    });
  });



  describe('Conditional Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should not require testId and shortDesc for type F', () => {
      component.form.patchValue({ notationType: 'F' });
      fixture.detectChanges();

      const testIdControl = component.form.get('testId');
      const shortDescControl = component.form.get('shortDesc');

      expect(testIdControl?.hasError('required')).toBeFalsy();
      expect(shortDescControl?.hasError('required')).toBeFalsy();
    });

    it('should not require testId and shortDesc for type S', () => {
      component.form.patchValue({ notationType: 'S' });
      fixture.detectChanges();

      const testIdControl = component.form.get('testId');
      const shortDescControl = component.form.get('shortDesc');

      expect(testIdControl?.hasError('required')).toBeFalsy();
      expect(shortDescControl?.hasError('required')).toBeFalsy();
    });

    it('should clear testId and shortDesc when changing to type S', () => {
      component.form.patchValue({
        notationType: 'R',
        testId: 'TEST123',
        shortDesc: 'Test Header'
      });

      component.form.patchValue({ notationType: 'S' });
      fixture.detectChanges();

      expect(component.form.value.testId).toBeNull();
      expect(component.form.value.shortDesc).toBeNull();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require effective date', () => {
      const effDateControl = component.form.get('effDate');
      effDateControl?.markAsTouched();
      expect(effDateControl?.hasError('required')).toBe(true);
    });


  });


});
