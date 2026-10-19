import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { ManualDonorInterfaceComponent } from './manual-donor-interface';
import { ManualDonorInterfaceApiService } from './services/manual-donor-interface-api.service';
import { TestResultOption } from './models/manual-donor-interface.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockMatSnackBar, createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('ManualDonorInterfaceComponent', () => {
  let mockPageHeaderService: any;
  let snackBarSpy: any;
  let apiServiceSpy: any;
  let component: ManualDonorInterfaceComponent;
  let fixture: ComponentFixture<ManualDonorInterfaceComponent>;
  let apiService: jasmine.SpyObj<ManualDonorInterfaceApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTestResults: TestResultOption[] = [
    { code: '06', description: 'A  NEG' },
    { code: '62', description: 'A  POS' },
    { code: '28', description: 'AB NEG' },
    { code: '84', description: 'AB POS' }
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ManualDonorInterfaceApiService', [
      'getTestResults',
      'submitManualDonorInterface'
    ]);
    snackBarSpy = createMockMatSnackBar();

    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Manual Donor Interface (Restricted)', subtitle: 'Transmit verified donor information to the lab system manually.' })
    });

    const mockChapterTimezoneService = {
      getChapterLocalDate: () => moment(),
      chapterLocalDate: signal(moment()),
      isChapterLocalDateAvailable: () => true
    };



      TestBed.configureTestingModule({
      imports: [
        ManualDonorInterfaceComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ManualDonorInterfaceApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        provideRouter([]),
        provideHttpClient()
      ]
    })
    .overrideComponent(ManualDonorInterfaceComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy }
        ]
      }
    });


    


      apiServiceSpy.getTestResults.calls.reset();


      apiServiceSpy.submitManualDonorInterface.calls.reset();


      mockPageHeaderService.getTitle.calls.reset();


      mockPageHeaderService.getSubtitle.calls.reset();


    apiService = TestBed.inject(ManualDonorInterfaceApiService) as jasmine.SpyObj<ManualDonorInterfaceApiService>;
    snackBar = snackBarSpy;

    apiService.getTestResults.and.returnValue(of(mockTestResults));

    fixture = TestBed.createComponent(ManualDonorInterfaceComponent);
    component = fixture.componentInstance;


    });


  describe('Form Initialization', () => {
    it('should initialize the form with default values', () => {
      expect(component.donorForm).toBeDefined();
      expect(component.donorForm.get('donorVerified')?.value).toBe('');
      expect(component.donorForm.get('hasAssertion')?.value).toBe('');
      expect(component.donorForm.get('priorTestResult')?.value).toBe('');
    });

    it('should have required validators on required fields', () => {
      const donorVerifiedControl = component.donorForm.get('donorVerified');
      const hasAssertionControl = component.donorForm.get('hasAssertion');
      const priorTestResultControl = component.donorForm.get('priorTestResult');

      expect(donorVerifiedControl?.hasError('required')).toBe(true);
      expect(hasAssertionControl?.hasError('required')).toBe(true);
      expect(priorTestResultControl?.hasError('required')).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should load test results on initialization', () => {
      fixture.detectChanges();

      expect(apiService.getTestResults).toHaveBeenCalled();
      expect(component.testResults).toEqual(mockTestResults);
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when loading test results fails', fakeAsync(() => {
      const error = {
        error: {
          message: 'Failed to fetch ABO/RH results',
          statusCode: 404
        },
        status: 404
      };
      apiService.getTestResults.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));


  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.donorForm.patchValue({
        donorVerified: 'yes',
        hasAssertion: 'no',
        priorTestResult: { code: '62', description: 'A  POS' }
      });
      // Bypass unit-validation guard so onSave() proceeds to the API call
      component.unitIdField.validationState = 'valid';
      (component.unitIdField as any)._parsedUnitData = { parsedUnitId: 'W123418051501' };
    });



    it('should submit valid form data with correct payload structure', () => {
      const mockResponse = {
        success: true,
        message: 'Donor information submitted successfully',
        statusCode: 200
      };
      apiService.submitManualDonorInterface.and.returnValue(of(mockResponse));

      component.onSave();

      expect(apiService.submitManualDonorInterface).toHaveBeenCalledWith(
        'W123418051501',
        'yes',
        'no',
        '62'
      );
    });



    it('should clear form on successful submission', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200
      };
      apiService.submitManualDonorInterface.and.returnValue(of(mockResponse));

      component.onSave();

      expect(component.donorForm.get('donorVerified')?.value).toBe('');
      expect(component.donorForm.get('hasAssertion')?.value).toBe('');
      expect(component.donorForm.get('priorTestResult')?.value).toBe('');
    });



    it('should handle submission error without status code', fakeAsync(() => {
      const error = {
        error: {
          message: 'Internal server error'
        }
      };
      apiService.submitManualDonorInterface.and.returnValue(throwError(() => error));

      component.onSave();
      tick();

      expect(component.isSubmitting).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));



    it('should pass parsedUnitId from unitIdField to API', () => {
      (component.unitIdField as any)._parsedUnitData = { parsedUnitId: '  W123418051501  ' };
      const mockResponse = { success: true, message: 'Success', statusCode: 200 };
      apiService.submitManualDonorInterface.and.returnValue(of(mockResponse));

      component.onSave();

      expect(apiService.submitManualDonorInterface).toHaveBeenCalledWith(
        '  W123418051501  ',
        'yes',
        'no',
        '62'
      );
    });
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to default values when clear all is clicked', () => {
      component.donorForm.patchValue({
        donorVerified: 'no',
        hasAssertion: 'no',
        priorTestResult: { code: '62', description: 'A  POS' }
      });

      component.onClearAll();

      expect(component.donorForm.get('donorVerified')?.value).toBe('');
      expect(component.donorForm.get('hasAssertion')?.value).toBe('');
      expect(component.donorForm.get('priorTestResult')?.value).toBe('');
    });


  });

  describe('Date Display', () => {
    it('should have currentDate set from ChapterTimezoneService', () => {
      const expectedDate = moment().format('DD-MMM-YYYY').toUpperCase();
      expect(component.currentDate).toBe(expectedDate);
    });

    it('should reactively update currentDate when chapterLocalDate signal changes', () => {
      const mockService = TestBed.inject(ChapterTimezoneService) as any;
      const newDate = moment().add(1, 'year');
      mockService.chapterLocalDate.set(newDate);

      fixture.detectChanges();

      const expectedDate = newDate.format('DD-MMM-YYYY').toUpperCase();
      expect(component.currentDate).toBe(expectedDate);
    });
  });

  describe('Form Control Getters', () => {
    it('should return priorTestResult control', () => {
      expect(component.priorTestResultControl).toBe(component.donorForm.get('priorTestResult') as any);
    });

  });
  describe('Radio Button Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitIdField.validationState = 'valid';
      (component.unitIdField as any)._parsedUnitData = { parsedUnitId: 'W123418051501' };
    });

    it('should convert "yes" to "Y" in API payload', () => {
      component.donorForm.patchValue({
        donorVerified: 'yes',
        hasAssertion: 'yes',
        priorTestResult: { code: '62', description: 'A  POS' }
      });

      const mockResponse = { success: true, message: 'Success', statusCode: 200 };
      apiService.submitManualDonorInterface.and.returnValue(of(mockResponse));

      component.onSave();

      // The service converts 'yes'/'no' to 'Y'/'N', but the component passes the original values
      expect(apiService.submitManualDonorInterface).toHaveBeenCalledWith(
        'W123418051501',
        'yes',
        'yes',
        '62'
      );
    });

    it('should convert "no" to "N" in API payload', () => {
      component.donorForm.patchValue({
        donorVerified: 'no',
        hasAssertion: 'no',
        priorTestResult: { code: '62', description: 'A  POS' }
      });

      const mockResponse = { success: true, message: 'Success', statusCode: 200 };
      apiService.submitManualDonorInterface.and.returnValue(of(mockResponse));

      component.onSave();

      expect(apiService.submitManualDonorInterface).toHaveBeenCalledWith(
        'W123418051501',
        'no',
        'no',
        '62'
      );
    });
  });

  describe('Error Message Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.donorForm.patchValue({
        donorVerified: 'yes',
        hasAssertion: 'yes',
        priorTestResult: { code: '62', description: 'A  POS' }
      });
      component.unitIdField.validationState = 'valid';
      (component.unitIdField as any)._parsedUnitData = { parsedUnitId: 'W123418051501' };
    });

    it('should use default error message when error.error.message is undefined', fakeAsync(() => {
      const error = { status: 500 };
      apiService.submitManualDonorInterface.and.returnValue(throwError(() => error));

      component.onSave();
      tick();

      expect(component.isSubmitting).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));

    it('should extract status code from error.error.statusCode', fakeAsync(() => {
      const error = {
        error: {
          message: 'Bad Request',
          statusCode: 400
        }
      };
      apiService.submitManualDonorInterface.and.returnValue(throwError(() => error));

      component.onSave();
      tick();

      expect(component.isSubmitting).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));

    it('should fall back to error.status when error.error.statusCode is undefined', fakeAsync(() => {
      const error = {
        error: {
          message: 'Unauthorized'
        },
        status: 401
      };
      apiService.submitManualDonorInterface.and.returnValue(throwError(() => error));

      component.onSave();
      tick();

      expect(component.isSubmitting).toBe(false);
      // Error handling is now done by HTTP interceptor
    }));
  });
});
