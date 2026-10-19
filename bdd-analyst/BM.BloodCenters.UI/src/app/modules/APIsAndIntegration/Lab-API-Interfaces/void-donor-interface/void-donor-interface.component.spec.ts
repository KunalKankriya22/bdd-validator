import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { VoidDonorInterfaceComponent } from './void-donor-interface.component';
import { VoidDonorInterfaceApiService } from './services/void-donor-interface-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { createMockHeaderService, createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  UnitDetailsResponse,
  VoidInterfaceResponse,
  DinErrorCode,
} from './models/void-donor-interface.model';

describe('VoidDonorInterfaceComponent', () => {
  let clearSpy: any;
  let componentLoggingService: any;
  let componentSnackBar: any;
  let component: VoidDonorInterfaceComponent;
  let fixture: ComponentFixture<VoidDonorInterfaceComponent>;
  let apiService: jasmine.SpyObj<VoidDonorInterfaceApiService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let chapterChangedSubject: Subject<unknown>;

  // --- Mock data ---

  const mockUnitDetailsSuccessResponse: UnitDetailsResponse = {
    success: true,
    message: 'Unit details retrieved successfully',
    statusCode: 200,
    item: {
      unitId: 'W633312320062',
      collectionDate: '2012-04-09T00:00:00',
      donorToLabInterfacePerformedOn: '2012-04-12T14:45:31',
    },
    errorResponse: { errorCode: '', error: '' },
  };

  const mockUnitDetailsNotInterfacedResponse: UnitDetailsResponse = {
    ...mockUnitDetailsSuccessResponse,
    item: {
      unitId: 'W633312320062',
      collectionDate: '2012-04-09T00:00:00',
      donorToLabInterfacePerformedOn: null,
    },
  };

  const mockVoidSuccessResponse: VoidInterfaceResponse = {
    success: true,
    message: 'Interface voided successfully',
    statusCode: 200,
  };

  const mockPostValidateData = {
    parsedUnitId: 'W633312320062',
    checkDigit: '2',
    codeScheme: 'I' as const,
    manualUnitId: 'W633312320062',
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const,
  };

  // --- Helpers ---

  function makePostValidateEvent(parsedUnitId = 'W633312320062'): {
    event: UnitIdPostValidateEvent;
    confirmSpy: jasmine.Spy;
    rejectSpy: jasmine.Spy;
  } {
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event: UnitIdPostValidateEvent = {
      data: { ...mockPostValidateData, parsedUnitId },
      confirm: confirmSpy,
      reject: rejectSpy,
    };
    return { event, confirmSpy, rejectSpy };
  }

  function setupValidatedState(clearSpy = jasmine.createSpy('clear')): void {
    component.canVoid = true;
    component.unitDetail = mockUnitDetailsSuccessResponse.item;
    component.unitIdField = { isValid: true, parsedUnitId: 'W633312320062', clear: clearSpy } as any;
  }

  // --- Setup ---

  beforeEach(() => {
    apiService = jasmine.createSpyObj('VoidDonorInterfaceApiService', [
      'getUnitDetails',
      'voidInterface',
    ]);
    const snackBarSpy = createMockMatSnackBar();
    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);
    chapterChangedSubject = new Subject<unknown>();
    const headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    TestBed.configureTestingModule({
      imports: [VoidDonorInterfaceComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: VoidDonorInterfaceApiService, useValue: apiService },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(VoidDonorInterfaceComponent);
    component = fixture.componentInstance;

    // MatSnackBar and LoggingService are providedIn:'root'. Angular standalone
    // components can resolve them from the environment injector (bypassing the
    // TestBed module-level spy). Spy on the component's actual injected instances
    // so assertions always track the calls the component really makes.
    componentSnackBar = (component as any)['snackBar'] as MatSnackBar;
    if (!jasmine.isSpy(componentSnackBar.open)) {
      spyOn(componentSnackBar, 'open');
    }
    snackBar = componentSnackBar as unknown as jasmine.SpyObj<MatSnackBar>;

    componentLoggingService = (component as any)['loggingService'] as LoggingService;
    if (!jasmine.isSpy(componentLoggingService.error)) {
      spyOn(componentLoggingService, 'error');
    }
    loggingService = componentLoggingService as unknown as jasmine.SpyObj<LoggingService>;

    fixture.detectChanges();
  });

  describe('Initial State', () => {
    it('should initialize with canVoid false', () => {
      expect(component.canVoid).toBe(false);
    });

    it('should initialize with isVoidLoading false', () => {
      expect(component.isVoidLoading).toBe(false);
    });

    it('should initialize collectionDate and interfaceTimestamp as null', () => {
      expect(component.collectionDate).toBeNull();
      expect(component.interfaceTimestamp).toBeNull();
    });
  });

  describe('onUnitPostValidate', () => {
    it('should reject immediately when parsedUnitId is empty', () => {
      const { event, rejectSpy } = makePostValidateEvent('');

      component.onUnitPostValidate(event);

      expect(rejectSpy).toHaveBeenCalledWith('Invalid unit ID');
      expect(apiService.getUnitDetails).not.toHaveBeenCalled();
    });

    it('should call getUnitDetails with the parsedUnitId', () => {
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetailsSuccessResponse));
      const { event } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(apiService.getUnitDetails).toHaveBeenCalledWith('W633312320062');
    });

    it('should call confirm and populate fields on successful unit details', () => {
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetailsSuccessResponse));
      const { event, confirmSpy } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(confirmSpy).toHaveBeenCalled();
      expect(component.canVoid).toBe(true);
      expect(component.collectionDate).toBe('09-APR-2012');
      expect(component.interfaceTimestamp).toMatch(/12-APR-2012 \d{2}:\d{2}:\d{2}/);
    });

    it('should set canVoid false when donorToLabInterfacePerformedOn is null', () => {
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetailsNotInterfacedResponse));
      const { event, confirmSpy } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(confirmSpy).toHaveBeenCalled();
      expect(component.canVoid).toBe(false);
      expect(component.interfaceTimestamp).toBeNull();
    });

    it('should call reject when getUnitDetails returns success false', () => {
      apiService.getUnitDetails.and.returnValue(of({
        ...mockUnitDetailsSuccessResponse,
        success: false,
        message: 'Unit not found',
      }));
      const { event, rejectSpy } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found');
    });

  });

  describe('onUnitCleared', () => {
    it('should reset unitDetail, canVoid, collectionDate and interfaceTimestamp', () => {
      component.unitDetail = mockUnitDetailsSuccessResponse.item;
      component.canVoid = true;
      component.collectionDate = '09-APR-2012';
      component.interfaceTimestamp = '12-APR-2012 14:45:31';

      component.onUnitCleared();

      expect(component.unitDetail).toBeUndefined();
      expect(component.canVoid).toBe(false);
      expect(component.collectionDate).toBeNull();
      expect(component.interfaceTimestamp).toBeNull();
    });
  });

  describe('onVoidInterface', () => {
    beforeEach(() => setupValidatedState());

    it('should call voidInterface with correct params', () => {
      apiService.voidInterface.and.returnValue(of(mockVoidSuccessResponse));

      component.onVoidInterface();

      expect(apiService.voidInterface).toHaveBeenCalledWith({
        unitId: 'W633312320062',
        collectionDate: '2012-04-09T00:00:00',
        confirmed: 'Y',
      });
    });




    it('should auto-clear 3 seconds after success', fakeAsync(() => {
      apiService.voidInterface.and.returnValue(of(mockVoidSuccessResponse));
      clearSpy = jasmine.createSpy('clear');
      component.unitIdField = { isValid: true, parsedUnitId: 'W633312320062', clear: clearSpy } as any;

      component.onVoidInterface();
      tick(3000);

      expect(clearSpy).toHaveBeenCalled();
      expect(component.canVoid).toBe(false);
    }));





  });

  describe('onClearAll', () => {
    it('should call clear on unitIdField and reset state', () => {
      clearSpy = jasmine.createSpy('clear');
      component.unitIdField = { isValid: true, parsedUnitId: 'W633312320062', clear: clearSpy } as any;
      component.canVoid = true;
      component.collectionDate = '09-APR-2012';
      component.interfaceTimestamp = '12-APR-2012 14:45:31';

      component.onClearAll();

      expect(clearSpy).toHaveBeenCalled();
      expect(component.canVoid).toBe(false);
      expect(component.collectionDate).toBeNull();
      expect(component.interfaceTimestamp).toBeNull();
    });
  });

  describe('Chapter Change Handling', () => {
    it('should reset state when chapter changes', () => {
      clearSpy = jasmine.createSpy('clear');
      component.unitIdField = { isValid: true, parsedUnitId: 'W633312320062', clear: clearSpy } as any;
      component.canVoid = true;
      component.collectionDate = '09-APR-2012';

      chapterChangedSubject.next('NEW_CHAPTER');

      expect(clearSpy).toHaveBeenCalled();
      expect(component.canVoid).toBe(false);
      expect(component.collectionDate).toBeNull();
    });
  });

  describe('Date Formatting', () => {
    it('should format collectionDate to DD-MMM-YYYY', () => {
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetailsSuccessResponse));
      const { event } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(component.collectionDate).toBe('09-APR-2012');
    });

    it('should format interfaceTimestamp to DD-MMM-YYYY HH:mm:ss', () => {
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetailsSuccessResponse));
      const { event } = makePostValidateEvent();

      component.onUnitPostValidate(event);

      expect(component.interfaceTimestamp).toMatch(/12-APR-2012 \d{2}:\d{2}:\d{2}/);
    });
  });
});
