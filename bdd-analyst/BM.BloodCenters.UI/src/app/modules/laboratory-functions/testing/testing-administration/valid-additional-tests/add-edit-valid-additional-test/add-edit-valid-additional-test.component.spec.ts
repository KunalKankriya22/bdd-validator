import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AddEditValidAdditionalTestComponent } from './add-edit-valid-additional-test.component';
import {
  ValidAdditionalTestDto,
  ValidAdditionalTestFormValue,
  ValidTestDropdownDto,
} from '../models/valid-additional-tests.model';
import { HeaderService } from '@shared/services/header.service';
import moment from 'moment';
import { createMockHeaderService } from '@shared/testing/common-mocks';

const futureDate = () => moment().add(30, 'days');
const futureDateFar = () => moment().add(90, 'days');

describe('AddEditValidAdditionalTestComponent', () => {
  let component: AddEditValidAdditionalTestComponent;
  let fixture: ComponentFixture<AddEditValidAdditionalTestComponent>;

  const mockTestOptions: ValidTestDropdownDto[] = [
    { testId: 'TEST001', testDesc: 'Hepatitis B Surface Antigen' },
    { testId: 'TEST002', testDesc: 'HIV-1/2 Antibody' }
  ];

  const mockValidTest: ValidAdditionalTestDto = {
    chapterId: '0001',
    testId: 'TEST001',
    testDesc: 'Hepatitis B Surface Antigen',
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
  };

  beforeEach(() => {

    const headerSpy = createMockHeaderService();



      TestBed.configureTestingModule({
imports: [AddEditValidAdditionalTestComponent, NoopAnimationsModule],
      providers: [
        { provide: HeaderService, useValue: headerSpy },
      ],
    });


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(AddEditValidAdditionalTestComponent);
    component = fixture.componentInstance;
    component.testOptions = mockTestOptions;


    });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = null;
      fixture.detectChanges();
    });



    it('should populate testDesc when testId is selected', () => {
      component.onTestIdChange('TEST001');
      expect(component.form.get('testDesc')?.value).toBe('Hepatitis B Surface Antigen');
    });

    it('should clear testDesc when testId is cleared', () => {
      component.onTestIdChange('TEST001');
      component.onTestIdChange(null);
      expect(component.form.get('testDesc')?.value).toBeNull();
    });

    it('should require testId field', () => {
      const control = component.form.get('testId');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require effDate field', () => {
      const control = component.form.get('effDate');
      expect(control?.hasError('required')).toBe(true);
    });

  });


  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should be valid with testId and effDate', () => {
      component.form.patchValue({
        testId: 'TEST001',
        effDate: futureDate()
      });
      expect(component.form.valid).toBe(true);
    });

    it('should validate testId max length', () => {
      component.form.patchValue({
        testId: '12345678901' // 11 characters
      });
      expect(component.form.get('testId')?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show error when effective date is in past (add mode)', () => {
      const pastDate = moment().subtract(3, 'days');
      component.form.patchValue({
        testId: 'TEST001',
        effDate: pastDate
      });
      component.form.get('effDate')?.markAsTouched();
      component.form.get('effDate')?.updateValueAndValidity();

      const error = component.getEffectiveDateError();
      expect(error).toContain('cannot be earlier than today');
    });

    it('should update termination min date when effective date changes', () => {
      const effDate = futureDate();
      component.form.patchValue({ effDate });

      expect(component.terminationMinDate.isSameOrAfter(effDate, 'day')).toBe(true);
    });



    it('should not show termination date error in edit mode when only touched but not dirty', () => {
      component.mode = 'edit';
      component.data = mockValidTest;
      fixture.detectChanges();
      component.ngOnInit();

      const termControl = component.form.get('termDate');
      termControl?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('');
    });

    it('should show termination date error in edit mode when dirty and invalid', () => {
      component.mode = 'edit';
      component.data = mockValidTest;
      fixture.detectChanges();
      component.ngOnInit();

      const termControl = component.form.get('termDate');
      termControl?.markAsDirty();
      termControl?.setErrors({ matDatepickerParse: true });

      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });




    it('should set isSubmitting to true on submit', () => {
      component.form.patchValue({
        testId: 'TEST001',
        effDate: futureDate()
      });

      component.onSubmit();
      expect(component.isSubmitting).toBe(true);
    });
  });
});
