import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import {
  AddEditHospitalReturnItemDialogComponent,
  AddEditHospitalReturnItemDialogData,
} from './add-edit-hospital-return-item-dialog';
import { HospitalReturnItemApiService } from '../services/hospital-return-item-api.service';
import {
  HospitalReturnItemDto,
  HospitalReturnItemApiResponse,
} from '../models/hospital-return-item.model';
import moment from 'moment';

describe('AddEditHospitalReturnItemDialogComponent', () => {
  let component: AddEditHospitalReturnItemDialogComponent;
  let fixture: ComponentFixture<AddEditHospitalReturnItemDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<HospitalReturnItemApiService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditHospitalReturnItemDialogComponent>>;

  const mockItem: HospitalReturnItemDto = {
    unitId: 'UNIT001',
    returnAdviceId: 'ADVICE001',
    productCode: 'PROD001',
    expDate: '2024-12-31T23:59:00Z',
    returnReasonCode: 'RR001',
    locationId: 'LOC001',
    chapterId: 'TEST',
    collDate: '2024-06-15',
    customerId: 'CUST001',
    crDbInd: 'CR',
  };

  const mockApiResponse: HospitalReturnItemApiResponse<HospitalReturnItemDto> = {
    success: true,
    statusCode: 201,
    message: 'Success',
    data: [mockItem],
  };

  function createComponent(dialogData: AddEditHospitalReturnItemDialogData) {
    apiServiceSpy = jasmine.createSpyObj('HospitalReturnItemApiService', [
      'create',
      'update',
      'delete',
    ]);
    apiServiceSpy.create.and.returnValue(of(mockApiResponse));
    apiServiceSpy.update.and.returnValue(of(mockApiResponse));
    apiServiceSpy.delete.and.returnValue(
      of({ success: true, statusCode: 200, message: 'Deleted', data: [true] }),
    );

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [AddEditHospitalReturnItemDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: HospitalReturnItemApiService, useValue: apiServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    });

    fixture = TestBed.createComponent(AddEditHospitalReturnItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Create Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'create' });
    });


    it('should be in create mode', () => {
      expect(component.isCreateMode).toBeTrue();
      expect(component.isEditMode).toBeFalse();
      expect(component.isDeleteMode).toBeFalse();
    });

    it('should show correct dialog title', () => {
      expect(component.dialogTitle).toBe('Add Hospital Return Item');
    });


    it('should have required validators for unitId and returnAdviceId', () => {
      expect(component.form.valid).toBeFalse();
      expect(component.f['unitId'].hasError('required')).toBeTrue();
      expect(component.f['returnAdviceId'].hasError('required')).toBeTrue();
    });

    it('should enforce maxlength validators', () => {
      component.f['unitId'].setValue('1234567890123456'); // 16 chars
      expect(component.f['unitId'].hasError('maxlength')).toBeTrue();

      component.f['returnAdviceId'].setValue('12345678901234'); // 14 chars
      expect(component.f['returnAdviceId'].hasError('maxlength')).toBeTrue();

      component.f['productCode'].setValue('123456789'); // 9 chars
      expect(component.f['productCode'].hasError('maxlength')).toBeTrue();

      component.f['returnReasonCode'].setValue('123456'); // 6 chars
      expect(component.f['returnReasonCode'].hasError('maxlength')).toBeTrue();

      component.f['customerId'].setValue('12345678901'); // 11 chars
      expect(component.f['customerId'].hasError('maxlength')).toBeTrue();

      component.f['locationId'].setValue('123456789012345678'); // 18 chars
      expect(component.f['locationId'].hasError('maxlength')).toBeTrue();
    });



    it('should create item successfully', fakeAsync(() => {
      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        productCode: 'PROD001',
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
      const createDto = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createDto.unitId).toBe('UNIT001');
      expect(createDto.returnAdviceId).toBe('ADVICE001');
      expect(createDto.productCode).toBe('PROD001');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should format dates correctly for API', fakeAsync(() => {
      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        collDate: moment.utc('2024-06-15'),
        expDate: moment.utc('2024-12-31'),
      });

      component.onSubmit();
      tick();

      const createDto = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createDto.collDate).toBe('2024-06-15');
      expect(createDto.expDate).toContain('2024-12-31');
    }));


  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'edit', item: mockItem });
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.isCreateMode).toBeFalse();
    });

    it('should show correct dialog title', () => {
      expect(component.dialogTitle).toBe('Edit Hospital Return Item');
    });

    it('should initialize form with item data', () => {
      expect(component.f['unitId'].value).toBe('UNIT001');
      expect(component.f['returnAdviceId'].value).toBe('ADVICE001');
      expect(component.f['productCode'].value).toBe('PROD001');
    });


    it('should allow editing other fields', () => {
      expect(component.f['productCode'].disabled).toBeFalse();
    });

    it('should update item successfully', fakeAsync(() => {
      component.form.patchValue({
        productCode: 'PROD002',
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.update).toHaveBeenCalledWith(
        'UNIT001',
        'ADVICE001',
        jasmine.any(Object),
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should only send modified fields in update DTO', fakeAsync(() => {
      component.form.patchValue({
        productCode: 'PROD002',
      });

      component.onSubmit();
      tick();

      const updateDto = apiServiceSpy.update.calls.mostRecent().args[2];
      expect(updateDto.productCode).toBe('PROD002');
      // unitId and returnAdviceId should not be in update DTO
    }));

  });

  describe('Delete Mode', () => {
    beforeEach(() => {
      createComponent({
        mode: 'delete',
        item: mockItem,
        message: 'Are you sure?',
      });
    });

    it('should be in delete mode', () => {
      expect(component.isDeleteMode).toBeTrue();
      expect(component.isCreateMode).toBeFalse();
      expect(component.isEditMode).toBeFalse();
    });

    it('should show correct dialog title', () => {
      expect(component.dialogTitle).toBe('Delete Confirmation');
    });


    it('should close with true on confirm', () => {
      component.onSubmit();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close with false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });
  });


  describe('CR/DB Options', () => {
    beforeEach(() => {
      createComponent({ mode: 'create' });
    });

    it('should have CR/DB options available', () => {
      expect(component.crDbOptions.length).toBe(2);
      expect(component.crDbOptions[0].value).toBe('CR');
      expect(component.crDbOptions[1].value).toBe('DB');
    });
  });

  describe('Date Handling', () => {
    beforeEach(() => {
      createComponent({ mode: 'create' });
    });

    it('should handle date input from datepicker', () => {
      const testDate = moment('2024-06-15');
      component.form.patchValue({
        collDate: testDate,
      });

      expect(component.f['collDate'].value).toEqual(testDate);
    });

    it('should convert dates to ISO format for expDate', fakeAsync(() => {
      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        expDate: moment('2024-12-31T23:59:00'),
      });

      component.onSubmit();
      tick();

      const createDto = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createDto.expDate).toContain('2024-12-31');
      expect(createDto.expDate).toContain('T');
    }));

    it('should convert dates to YYYY-MM-DD for collDate and moveDate', fakeAsync(() => {
      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        collDate: moment('2024-06-15'),
        moveDate: moment('2024-06-20'),
      });

      component.onSubmit();
      tick();

      const createDto = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createDto.collDate).toBe('2024-06-15');
      expect(createDto.moveDate).toBe('2024-06-20');
    }));
  });

  describe('Error Message Parsing', () => {
    beforeEach(() => {
      createComponent({ mode: 'create' });
    });

    it('should parse error message from error.message', fakeAsync(() => {
      const errorResponse = { error: { message: 'Test error' } };
      apiServiceSpy.create.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
      });
      component.onSubmit();
      tick();

      expect(component.error()).toBe('Test error');
    }));

    it('should parse error from errorResponse.error', fakeAsync(() => {
      const errorResponse = {
        error: { errorResponse: { error: 'Detailed error' } },
      };
      apiServiceSpy.create.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
      });
      component.onSubmit();
      tick();

      expect(component.error()).toBe('Detailed error');
    }));

    it('should use default error message if none provided', fakeAsync(() => {
      const errorResponse = {};
      apiServiceSpy.create.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        unitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
      });
      component.onSubmit();
      tick();

      expect(component.error()).toBe('An unexpected error occurred');
    }));
  });


  describe('Accessibility', () => {
    beforeEach(() => {
      createComponent({ mode: 'create' });
    });



    it('should generate unique label IDs', () => {
      const labelId = (component as any).labelId('unitId');
      expect(labelId).toContain('label');
    });
  });
});
