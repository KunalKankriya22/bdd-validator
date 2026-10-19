import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import moment from 'moment';

import { AddEditDonorInterdictionOverride } from './add-edit-donor-interdiction-override';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';
import { DonorInterdictionOverrideModel } from '../models/donor-interdiction-override.model';
import { CookieService } from 'ngx-cookie-service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditDonorInterdictionOverride', () => {
  let component: AddEditDonorInterdictionOverride;
  let fixture: ComponentFixture<AddEditDonorInterdictionOverride>;
  let mockService: jasmine.SpyObj<DonorInterdictionOverrideService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockCookieService: jasmine.SpyObj<CookieService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockDropdownsResponse = {
    success: true,
    data: {
      donorDecisionCodes: [{ code: 'CUE1', description: 'Test Cue' }],
      productTypes: [{ code: 'PT1', description: 'Product Type 1' }],
      attributeGroups: [{ code: 'AG1', description: 'Attribute Group 1' }],
      attributeCodes: [{ code: 'AC1', description: 'Attribute Code 1' }],
      interCodes: [{ code: 'IC1', description: 'Interdiction Code 1' }],
      interTypes: [{ code: 'N', description: 'No effect' }]
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorInterdictionOverrideService', [
      'getDropdowns',
      'getAttribCodesByGroup',
      'createOverride',
      'updateOverride'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockCookieService = jasmine.createSpyObj('CookieService', ['get']);
    mockHeaderService = createMockHeaderService();

    mockService.getDropdowns.and.returnValue(of(mockDropdownsResponse as any));
    mockService.getAttribCodesByGroup.and.returnValue(of([{ code: 'AC1', description: 'Attribute Code 1' }]));
    mockCookieService.get.and.returnValue('TESTUSER');
      TestBed.configureTestingModule({
      imports: [
        AddEditDonorInterdictionOverride,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: DonorInterdictionOverrideService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: CookieService, useValue: mockCookieService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getDropdowns.calls.reset();


      mockService.getAttribCodesByGroup.calls.reset();


      mockService.createOverride.calls.reset();


      mockService.updateOverride.calls.reset();


      mockCookieService.get.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockService.getDropdowns.and.returnValue(of(mockDropdownsResponse as any));


      mockService.getAttribCodesByGroup.and.returnValue(of([{ code: 'AC1', description: 'Attribute Code 1' }]));


      mockCookieService.get.and.returnValue('TESTUSER');


    fixture = TestBed.createComponent(AddEditDonorInterdictionOverride);
    component = fixture.componentInstance;


    });


  describe('Termination Date Validation for Terminated Records', () => {
    let terminatedRecord: DonorInterdictionOverrideModel;

    beforeEach(() => {
      // Create a terminated record (termination date in the past)
      const pastDate = moment().subtract(30, 'days').toDate();
      terminatedRecord = {
        donorDecisionCode: 'CUE1',
        productType: 'PT1',
        productTypeDesc: 'Product Type 1',
        attributeGroup: 'AG1',
        attributeCode: 'AC1',
        interCode: 'IC1',
        interDesc: 'Interdiction Code 1',
        interType: 'N',
        overrideDesc: 'Test Override',
        effDate: moment().subtract(60, 'days').toDate(),
        termDate: pastDate,
        lastModifiedDate: moment().subtract(1, 'days').toDate()
      };
    });

    it('should load terminated record without showing termination date error', () => {
      component.mode = 'edit';
      component.data = terminatedRecord;
      fixture.detectChanges();
      component.ngOnInit();

      const termDateControl = component.form.get('termDate');
      expect(termDateControl?.value).toBeTruthy();
      expect(termDateControl?.touched).toBeFalsy();
      expect(component.getTermDateError()).toBe('');
    });

    it('should show termination date error only when field is touched', () => {
      component.mode = 'edit';
      component.data = terminatedRecord;
      fixture.detectChanges();
      component.ngOnInit();

      const termDateControl = component.form.get('termDate');

      // Initially untouched - no error
      expect(termDateControl?.touched).toBeFalsy();
      expect(component.getTermDateError()).toBe('');

      // Touch the field
      termDateControl?.markAsTouched();
      fixture.detectChanges();

      // Now error should appear
      expect(component.getTermDateError()).toContain('Termination Date cannot be in the past');
    });

    it('should enable save when editing other fields without touching termination date', (done) => {
      component.mode = 'edit';
      component.data = terminatedRecord;
      fixture.detectChanges();
      component.ngOnInit();

      // Wait for async operations to complete
      fixture.whenStable().then(() => {
        // Ensure all required fields are filled
        component.form.patchValue({
          donorDecisionCode: 'CUE1',
          productType: 'PT1',
          interCode: 'IC1',
          interType: 'N',
          overrideDesc: 'Test Override',
          effDate: moment().subtract(60, 'days')
        });

        // Edit description field to make form dirty
        component.form.get('overrideDesc')?.setValue('Updated Description');
        component.form.markAsDirty();
        fixture.detectChanges();

        const termDateControl = component.form.get('termDate');
        expect(termDateControl?.touched).toBeFalsy();
        expect(component.isFormValid).toBeTruthy();
        done();
      });
    });



    it('should restore termination date untouched state in onSave if not manually touched', () => {
      component.mode = 'edit';
      component.data = terminatedRecord;
      fixture.detectChanges();
      component.ngOnInit();

      // Edit description
      component.form.get('overrideDesc')?.setValue('Updated Description');
      component.form.markAsDirty();

      const termDateControl = component.form.get('termDate');
      expect(termDateControl?.touched).toBeFalsy();

      // Mock the update service call
      mockService.updateOverride.and.returnValue(of({ success: true, message: 'Updated successfully' }));

      // Call onSave
      component.onSave();

      // Termination date should still be untouched
      expect(termDateControl?.touched).toBeFalsy();
    });



    it('should mark form as pristine and untouched after population in edit mode', (done) => {
      component.mode = 'edit';
      component.data = terminatedRecord;
      fixture.detectChanges();
      component.ngOnInit();

      // Wait for async operations
      fixture.whenStable().then(() => {
        expect(component.form.pristine).toBeTruthy();
        const termDateControl = component.form.get('termDate');
        expect(termDateControl?.touched).toBeFalsy();
        done();
      });
    });
  });

  describe('Add Mode', () => {
    it('should not have termination date validation for past dates in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.ngOnInit();

      const termDateControl = component.form.get('termDate');
      const futureDate = moment().add(10, 'days');
      termDateControl?.setValue(futureDate);
      termDateControl?.markAsTouched();

      expect(component.getTermDateError()).toBe('');
    });
  });
});
