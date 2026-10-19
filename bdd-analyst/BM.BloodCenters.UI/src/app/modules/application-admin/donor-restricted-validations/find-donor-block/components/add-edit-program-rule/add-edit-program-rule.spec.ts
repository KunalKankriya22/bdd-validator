import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AddEditProgramRuleComponent } from './add-edit-program-rule';
import { FindDonorBlockService } from '../../services/find-donor-block.service';
import { FindDonorBlockModel } from '../../models/find-donor-block.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditProgramRuleComponent', () => {
  let findDonorServiceSpy: any;
  let component: AddEditProgramRuleComponent;
  let fixture: ComponentFixture<AddEditProgramRuleComponent>;
  let findDonorBlockService: jasmine.SpyObj<FindDonorBlockService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  // Reflects DONOR_GRADING_MATRIX values from the new grade-levels API
  const mockDropdownValues = {
    programNames: ['PROGRAM_A', 'PROGRAM_B'],
    gradeLevels: ['1', '2', '3', '5', '8']
  };

  const mockProgramData: FindDonorBlockModel = {
    programName: 'TEST_PROG',
    createNewDonor: true,
    gradeLevel: '2',
    newAllowed: 'Optional',
    newAllowedGrade: '1',
    selectAllowed: true,
    selectAllowedGrade: '2',
    selectMultipleGrade: '3',
    holdAllowed: false,
    flag1: true,
    flag2: false,
    flag3: false,
    flag4: false,
    multipleSelection: 'N',
    updateKeyInfo: 'N',
    enforcePassword: 'Y'
  };

  beforeEach(() => {

    findDonorServiceSpy = jasmine.createSpyObj('FindDonorBlockService', [
      'getDropdownValues',
      'getProgramIds',
      'addProgramRule',
      'updateProgramRule',
      'mapFormDataToAddDto',
      'mapFormDataToUpdateDto'
    ]);

    const snackBarSpy = createMockMatSnackBar();



      TestBed.configureTestingModule({
imports: [
        AddEditProgramRuleComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: FindDonorBlockService, useValue: findDonorServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });


    });



  beforeEach(() => {


      findDonorServiceSpy.getDropdownValues.calls.reset();


      findDonorServiceSpy.getProgramIds.calls.reset();


      findDonorServiceSpy.addProgramRule.calls.reset();


      findDonorServiceSpy.updateProgramRule.calls.reset();


      findDonorServiceSpy.mapFormDataToAddDto.calls.reset();


      findDonorServiceSpy.mapFormDataToUpdateDto.calls.reset();


    findDonorBlockService = TestBed.inject(FindDonorBlockService) as jasmine.SpyObj<FindDonorBlockService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    findDonorBlockService.getDropdownValues.and.returnValue(of(mockDropdownValues));
    findDonorBlockService.getProgramIds.and.returnValue(of([]));


    });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditProgramRuleComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {

    it('should load grade levels from DONOR_GRADING_MATRIX via getDropdownValues', () => {
      fixture.detectChanges();

      expect(findDonorBlockService.getDropdownValues).toHaveBeenCalled();
      expect(component.programNameOptions).toEqual(mockDropdownValues.programNames);
      expect(component.gradeLevelOptions).toEqual(['1', '2', '3', '5', '8']);
    });

    it('should fall back to default grade levels when getDropdownValues fails', () => {
      findDonorBlockService.getDropdownValues.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.programNameOptions).toEqual([]);
      expect(component.gradeLevelOptions).toEqual(['0', '1', '2', '3', '4']);
    });

  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should return required error message for programName', () => {
      const control = component.programRuleForm.get('programName');
      control?.markAsTouched();

      const error = component.getFieldError('programName');
      expect(error).toBe('Program Name is required');
    });

    describe('programName maxlength (varchar2(10))', () => {


      it('should return maxlength error message via getFieldError when programName exceeds 10 characters', () => {
        const control = component.programRuleForm.get('programName');
        control?.setValue('ABCDEFGHIJK'); // 11 characters

        const error = component.getFieldError('programName');
        expect(error).toBe('Maximum 10 characters allowed');
      });


      it('should prioritise required error over maxlength when field is empty and touched', () => {
        const control = component.programRuleForm.get('programName');
        control?.setValue(null);
        control?.markAsTouched();

        const error = component.getFieldError('programName');
        expect(error).toBe('Program Name is required');
      });
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.programRuleForm.patchValue({
        programName: 'NEW_PROG',
        createNewDonor: true,
        gradeLevel: '1',
        newAllowed: true,
        selectAllowed: true,
        holdAllowed: false
      });
    });

    it('should call addProgramRule service method on save', () => {
      const mockAddDto = {
        programName: 'NEW_PROG',
        allowCreate: 'Y',
        gradingLevel: '1',
        allowNew: 'Y',
        allowSelect: 'Y',
        allowHold: 'N'
      };

      findDonorBlockService.mapFormDataToAddDto.and.returnValue(mockAddDto as any);
      findDonorBlockService.addProgramRule.and.returnValue(
        of({ message: 'Program created successfully.' })
      );

      component.onSave();

      expect(findDonorBlockService.addProgramRule).toHaveBeenCalledWith(mockAddDto);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockProgramData;
      fixture.detectChanges();
    });

    it('should call updateProgramRule service method on save', () => {
      const mockUpdateDto = {
        allowCreate: 'Y',
        gradingLevel: '2',
        allowNew: 'O',
        allowSelect: 'Y',
        allowHold: 'N',
        multipleSelection: 'N',
        updateKeyInfo: 'N',
        enforcePassword: 'Y'
      };

      findDonorBlockService.mapFormDataToUpdateDto.and.returnValue(mockUpdateDto as any);
      findDonorBlockService.updateProgramRule.and.returnValue(
        of({ message: 'Program updated successfully.' })
      );

      component.onSave();

      expect(findDonorBlockService.updateProgramRule).toHaveBeenCalledWith(
        'TEST_PROG',
        mockUpdateDto
      );
    });

    it('should preserve hidden fields when updating', () => {
      findDonorBlockService.mapFormDataToUpdateDto.and.callFake((data) => {
        expect(data.multipleSelection).toBe('N');
        expect(data.updateKeyInfo).toBe('N');
        expect(data.enforcePassword).toBe('Y');
        return {} as any;
      });

      findDonorBlockService.updateProgramRule.and.returnValue(
        of({ message: 'Updated' })
      );

      component.onSave();

      expect(findDonorBlockService.mapFormDataToUpdateDto).toHaveBeenCalled();
    });
  });


  describe('Panel Title', () => {
    it('should return correct title for add mode', () => {
      component.mode = 'add';
      expect(component.panelTitle).toBe('Add New Program Rule');
    });

    it('should return correct title for edit mode', () => {
      component.mode = 'edit';
      expect(component.panelTitle).toBe('Edit Program Rule');
    });
  });
});
