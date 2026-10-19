import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ISBTUnitCheckDigitDialog } from './isbt-unit-check-digit';
import { ISBTUnitCheckDigitService } from './isbt-unit-check-digit.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ISBTUnitCheckDigitDialogData,
  ISBTCheckDigitResponse
} from './isbt-unit-check-digit.model';

describe('ISBTUnitCheckDigitDialog', () => {
  let component: ISBTUnitCheckDigitDialog;
  let fixture: ComponentFixture<ISBTUnitCheckDigitDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ISBTUnitCheckDigitDialog>>;
  let mockService: jasmine.SpyObj<ISBTUnitCheckDigitService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ISBTUnitCheckDigitDialogData = {};

  const mockSuccessResponse: ISBTCheckDigitResponse = {
    success: true,
    statusCode: 200,
    message: 'Check digit calculated successfully',
    data: {
      unitId: 'ABC1234567890',
      checkDigit: '7',
      unitIdWithCheckDigit: 'ABC12345678907'
    }
  };

  beforeEach(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const serviceSpy = jasmine.createSpyObj('ISBTUnitCheckDigitService', ['calculateCheckDigit', 'calculateBatchCheckDigits']);
    const snackbarSpy = createMockSnackbarService();

    serviceSpy.calculateCheckDigit.and.returnValue(of(mockSuccessResponse));

    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ISBTUnitCheckDigitDialog
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ISBTUnitCheckDigitService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    });

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ISBTUnitCheckDigitDialog>>;
    mockService = TestBed.inject(ISBTUnitCheckDigitService) as jasmine.SpyObj<ISBTUnitCheckDigitService>;
    mockSnackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    fixture = TestBed.createComponent(ISBTUnitCheckDigitDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  describe('Initialization', () => {




    it('should not be loading initially', () => {
      expect(component.loading).toBeFalse();
    });

    it('should prefill unit ID when provided in dialog data', () => {
      const dataWithPrefill: ISBTUnitCheckDigitDialogData = {
        prefilledUnitId: 'ABC1234567890'
      };

      const newFixture = TestBed.createComponent(ISBTUnitCheckDigitDialog);
      const newComponent = newFixture.componentInstance;
      newComponent.data = dataWithPrefill;
      newComponent.ngOnInit();

      expect(newComponent.unitIdForm.value.unitId).toBe('ABC1234567890');
    });
  });

  describe('Form Validation', () => {
    it('should validate unitId must be exactly 13 characters - too short', () => {
      const unitIdControl = component.unitIdForm.get('unitId');
      unitIdControl?.setValue('SHORT');
      expect(unitIdControl?.hasError('exactLength')).toBeTrue();
    });

    it('should validate unitId must be exactly 13 characters - too long', () => {
      const unitIdControl = component.unitIdForm.get('unitId');
      unitIdControl?.setValue('TOOLONGUNITID1234');
      expect(unitIdControl?.hasError('exactLength')).toBeTrue();
    });

    it('should accept valid 13 character unitId', () => {
      const unitIdControl = component.unitIdForm.get('unitId');
      unitIdControl?.setValue('ABC1234567890');
      expect(unitIdControl?.valid).toBeTrue();
    });
  });

  describe('Error Messages', () => {
    it('should return correct error message for length validation', () => {
      const unitIdControl = component.unitIdForm.get('unitId');
      unitIdControl?.setValue('SHORT');
      unitIdControl?.markAsTouched();

      expect(component.getUnitIdError()).toBe('Unit ID must be exactly 13 characters');
    });


  });

  describe('Retrieve Functionality', () => {
    it('should set required error when submitting with empty Unit ID', () => {
      component.unitIdForm.get('unitId')?.setValue('');

      component.onRetrieve();

      expect(component.unitIdForm.get('unitId')?.hasError('required')).toBeTrue();
      expect(component.getUnitIdError()).toBe('Please enter a Unit ID');
      expect(mockService.calculateCheckDigit).not.toHaveBeenCalled();
    });

    it('should call service with valid unitId on retrieve', () => {
      // Arrange
      component.unitIdForm.get('unitId')?.setValue('ABC1234567890');

      // Act
      component.onRetrieve();

      // Assert
      expect(mockService.calculateCheckDigit).toHaveBeenCalledWith({ unitId: 'ABC1234567890' });
    });

    it('should prepend result to the beginning of results array on successful retrieve', () => {
      // Arrange - add an existing result
      component.results = [{
        unitId: 'EXISTING000001',
        checkDigit: '1',
        unitIdWithCheckDigit: 'EXISTING0000011'
      }];
      component.unitIdForm.get('unitId')?.setValue('ABC1234567890');

      // Act
      component.onRetrieve();

      // Assert
      expect(component.results[0]).toEqual(mockSuccessResponse.data);
      expect(component.results.length).toBe(2);
      expect(component.loading).toBeFalse();
    });





    it('should handle HTTP error and show error message', () => {
      // Arrange
      const httpError = {
        error: {
          errorResponse: {
            error: 'Internal server error'
          }
        }
      };
      mockService.calculateCheckDigit.and.returnValue(throwError(() => httpError));
      component.unitIdForm.get('unitId')?.setValue('ABC1234567890');

      // Act
      component.onRetrieve();

      // Assert
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Internal server error');
      expect(component.loading).toBeFalse();
    });



    it('should automatically strip whitespace from unit ID via valueChanges', () => {
      component.unitIdForm.get('unitId')?.setValue('ABC 1234567890');

      expect(component.unitIdForm.get('unitId')?.value).toBe('ABC1234567890');
    });

    it('should strip all whitespace types from pasted unit ID', () => {
      component.unitIdForm.get('unitId')?.setValue(' ABC\t123456789 ');

      expect(component.unitIdForm.get('unitId')?.value).toBe('ABC123456789');
    });

    it('should convert lowercase letters to uppercase', () => {
      component.unitIdForm.get('unitId')?.setValue('abc1234567890');

      expect(component.unitIdForm.get('unitId')?.value).toBe('ABC1234567890');
    });
  });
});
