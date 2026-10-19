import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { LinkTestResultsComponent } from './link-test-results';
import { LinkTestResultsApiService } from './services/link-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { LoggingService } from '@shared/services/logging.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ValidateResponse,
  ValidateResponseData,
  TransferResponse,
  TestResultDto,
} from './models/link-test-results.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';

describe('LinkTestResultsComponent', () => {
  let component: LinkTestResultsComponent;
  let fixture: ComponentFixture<LinkTestResultsComponent>;
  let apiServiceSpy: jasmine.SpyObj<LinkTestResultsApiService>;
  let headerServiceMock: { chapterChanged$: Subject<void> };
  let pageHeaderServiceMock: any;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const mockSampleTests: TestResultDto[] = [
    {
      testId: 'HCV001',
      testSeqNo: 1,
      testDescription: 'Hepatitis C Virus',
      resultStatus: 'C',
      resultStatusDescription: 'Complete',
      absorbance: '0.12',
    },
    {
      testId: 'HIV001',
      testSeqNo: 2,
      testDescription: 'HIV Antibody',
      resultStatus: 'C',
      resultStatusDescription: 'Complete',
    },
  ];

  const mockPrimaryTests: TestResultDto[] = [
    {
      testId: 'ABO001',
      testSeqNo: 1,
      testDescription: 'ABO Typing',
      resultStatus: 'C',
      resultStatusDescription: 'Complete',
    },
  ];

  const mockValidateData: ValidateResponseData = {
    canTransfer: true,
    primaryUnitId: 'W633319111560',
    primaryCollDate: '2024-01-15T00:00:00Z',
    sampleUnitId: 'W633319222222',
    sampleCollDate: '2024-01-16T00:00:00Z',
    isAutologous: false,
    primaryCompletedTests: mockPrimaryTests,
    sampleTransferableTests: mockSampleTests,
  };

  const mockValidateResponse: ValidateResponse = {
    success: true,
    message: 'Validation successful',
    statusCode: 200,
    canTransfer: true,
    data: mockValidateData,
  };

  const mockTransferResponse: TransferResponse = {
    success: true,
    message: 'Transfer successful',
    statusCode: 200,
    data: {
      success: true,
      message: 'Transfer complete',
      testResultsTransferred: 2,
      sourceUnitId: 'W633319222222',
      targetUnitId: 'W633319111560',
    },
  };

  function makeUnitValidationResponse(unitId: string): UnitValidationResponse {
    return {
      parsedUnitId: unitId,
      checkDigit: null,
      codeScheme: 'I',
      manualUnitId: unitId,
      codabarUnitScheme: null,
      entryMode: 'M',
      barcodeType: 'CODE128',
      chapterScheme: 'I',
    };
  }

  function setUpAllFields(): void {
    component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
    component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
    component.transmitForm.get('transmitTestResults')!.setValue('yes');
  }

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('LinkTestResultsApiService', ['validate', 'transfer']);
    headerServiceMock = { chapterChanged$: new Subject<void>() };
    pageHeaderServiceMock = {
      pageHeaderData: signal(undefined),
      getTitle: () => undefined,
      getSubtitle: () => undefined,
    };
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['log', 'error', 'warn', 'debug']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open', 'dismiss']);

    apiServiceSpy.validate.and.returnValue(of(mockValidateResponse));
    apiServiceSpy.transfer.and.returnValue(of(mockTransferResponse));

    TestBed.configureTestingModule({
      imports: [LinkTestResultsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LinkTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
      ],
    });

    fixture = TestBed.createComponent(LinkTestResultsComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start with no validation data', () => {
      fixture.detectChanges();
      expect((component as any).hasData()).toBeFalse();
    });

    it('should start with empty sample and primary tests', () => {
      fixture.detectChanges();
      expect(component.sampleTestsData.length).toBe(0);
      expect(component.primaryTestsData.length).toBe(0);
    });

    it('should start with empty selected keys', () => {
      fixture.detectChanges();
      expect((component as any).selectedKeys().size).toBe(0);
    });

    it('should initialize transmit form with null value', () => {
      fixture.detectChanges();
      expect(component.transmitForm.get('transmitTestResults')!.value).toBeNull();
    });

    it('should define left and right table configs', () => {
      fixture.detectChanges();
      expect(component.leftTableConfig.enableSelection).toBeTrue();
      expect(component.rightTableConfig.enableSelection).toBeUndefined();
    });

    it('should configure header with breadcrumbs', () => {
      fixture.detectChanges();
      expect(component.headerConfig.title).toBe('Link Test Results');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
    });
  });

  describe('Page Header Effect', () => {
    it('should update header config when pageHeaderData emits', () => {
      fixture.detectChanges();
      pageHeaderServiceMock.pageHeaderData.set({ title: 'Custom Title', subtitle: 'Custom Subtitle' });
      TestBed.flushEffects();

      expect(component.headerConfig.title).toBe('Custom Title');
      expect(component.headerConfig.subtitle).toBe('Custom Subtitle');
    });

    it('should use existing subtitle as fallback when page data has no subtitle', () => {
      fixture.detectChanges();
      const existingSubtitle = component.headerConfig.subtitle;
      pageHeaderServiceMock.pageHeaderData.set({ title: 'No Sub' });
      TestBed.flushEffects();

      expect(component.headerConfig.title).toBe('No Sub');
      expect(component.headerConfig.subtitle).toBe(existingSubtitle);
    });
  });

  describe('Unit ID Events', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set parsedUnitId on validated event', () => {
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      expect((component as any).parsedUnitId()).toBe('W633319111560');
    });

    it('should set parsedSampleUnitId on sample validated event', () => {
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
      expect((component as any).parsedSampleUnitId()).toBe('W633319222222');
    });

    it('should clear parsedUnitId on unit cleared', () => {
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      component.onUnitIdCleared();
      expect((component as any).parsedUnitId()).toBeNull();
    });

    it('should clear parsedSampleUnitId on sample cleared', () => {
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
      component.onSampleUnitIdCleared();
      expect((component as any).parsedSampleUnitId()).toBeNull();
    });

    it('should clear validation data when unit ID changes', () => {
      (component as any).validationData.set(mockValidateData);
      component.onUnitIdValidated(makeUnitValidationResponse('NEW_UNIT'));
      expect((component as any).validationData()).toBeNull();
    });

    it('should clear validation data when sample unit ID changes', () => {
      (component as any).validationData.set(mockValidateData);
      component.onSampleUnitIdValidated(makeUnitValidationResponse('NEW_SAMPLE'));
      expect((component as any).validationData()).toBeNull();
    });
  });

  describe('Validation Trigger (tryRunValidation)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call validate when only unitId is set', () => {
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      expect(apiServiceSpy.validate).not.toHaveBeenCalled();
    });

    it('should not call validate when only sampleUnitId is set', () => {
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
      expect(apiServiceSpy.validate).not.toHaveBeenCalled();
    });

    it('should not call validate when transmitTestResults is not set', () => {
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
      expect(apiServiceSpy.validate).not.toHaveBeenCalled();
    });

    it('should call validate when all three fields are set', fakeAsync(() => {
      setUpAllFields();
      tick();

      expect(apiServiceSpy.validate).toHaveBeenCalledWith({
        sourceUnitId: 'W633319222222',
        targetUnitId: 'W633319111560',
      });
    }));
  });

  describe('Validation API Call (runValidation)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set validating to true while in progress', fakeAsync(() => {
      let validatingDuringCall = false;
      apiServiceSpy.validate.and.callFake(() => {
        validatingDuringCall = (component as any).validating();
        return of(mockValidateResponse);
      });

      setUpAllFields();
      tick();

      expect(validatingDuringCall).toBeTrue();
      expect((component as any).validating()).toBeFalse();
    }));

    it('should populate panels on successful canTransfer response', fakeAsync(() => {
      setUpAllFields();
      tick();

      expect((component as any).validationData()).toEqual(mockValidateData);
      expect(component.sampleTestsData.length).toBe(2);
      expect(component.primaryTestsData.length).toBe(1);
    }));

    it('should add rowKey to each test row', fakeAsync(() => {
      setUpAllFields();
      tick();

      expect(component.sampleTestsData[0].rowKey).toBe('HCV001:1');
      expect(component.sampleTestsData[1].rowKey).toBe('HIV001:2');
    }));

    it('should auto-select all sample tests when transmit dropdown is yes', fakeAsync(() => {
      setUpAllFields();
      tick();

      const keys = (component as any).selectedKeys();
      expect(keys.size).toBe(2);
      expect(keys.has('HCV001:1')).toBeTrue();
      expect(keys.has('HIV001:2')).toBeTrue();
    }));

    it('should not auto-select when transmit dropdown is no', fakeAsync(() => {
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));
      component.transmitForm.get('transmitTestResults')!.setValue('no');
      tick();

      expect((component as any).selectedKeys().size).toBe(0);
    }));

    it('should show snackbar when canTransfer is false', fakeAsync(() => {
      const noTransferResponse: ValidateResponse = {
        ...mockValidateResponse,
        message: 'Units not eligible',
        data: { ...mockValidateData, canTransfer: false },
      };
      apiServiceSpy.validate.and.returnValue(of(noTransferResponse));

      setUpAllFields();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Units not eligible',
        'DISMISS',
        jasmine.objectContaining({ duration: 6000 })
      );
      expect((component as any).validationData()).toBeNull();
    }));

    it('should show default message when canTransfer is false and no message', fakeAsync(() => {
      const noTransferResponse: ValidateResponse = {
        ...mockValidateResponse,
        message: '',
        data: { ...mockValidateData, canTransfer: false },
      };
      apiServiceSpy.validate.and.returnValue(of(noTransferResponse));

      setUpAllFields();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Transfer is not eligible for these units',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle validation error with error.error.message', fakeAsync(() => {
      apiServiceSpy.validate.and.returnValue(
        throwError(() => ({ error: { message: 'Server error msg' }, message: 'HTTP error' }))
      );

      setUpAllFields();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Server error msg', 'DISMISS', jasmine.any(Object));
      expect(loggingServiceSpy.error).toHaveBeenCalled();
    }));

    it('should handle validation error with error.message fallback', fakeAsync(() => {
      apiServiceSpy.validate.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      setUpAllFields();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Network error', 'DISMISS', jasmine.any(Object));
    }));

    it('should handle validation error with default fallback message', fakeAsync(() => {
      apiServiceSpy.validate.and.returnValue(throwError(() => ({})));

      setUpAllFields();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Validation failed. Please check the unit IDs.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should set validating to false on error', fakeAsync(() => {
      apiServiceSpy.validate.and.returnValue(throwError(() => new Error('fail')));

      setUpAllFields();
      tick();

      expect((component as any).validating()).toBeFalse();
    }));

    it('should handle null tests arrays gracefully via toRows', fakeAsync(() => {
      const responseWithNulls: ValidateResponse = {
        ...mockValidateResponse,
        data: {
          ...mockValidateData,
          sampleTransferableTests: null as any,
          primaryCompletedTests: null as any,
        },
      };
      apiServiceSpy.validate.and.returnValue(of(responseWithNulls));

      setUpAllFields();
      tick();

      expect(component.sampleTestsData.length).toBe(0);
      expect(component.primaryTestsData.length).toBe(0);
    }));
  });

  describe('skipNextAutoSelect', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not auto-select after successful transmit re-validates', fakeAsync(() => {
      setUpAllFields();
      tick();
      apiServiceSpy.validate.calls.reset();

      component.onTransmit();
      tick();

      expect((component as any).selectedKeys().size).toBe(0);
    }));
  });

  describe('Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      setUpAllFields();
      tick();
    }));

    it('should return selectedKeys via externalSelectedKeys getter', () => {
      expect(component.externalSelectedKeys).toBe((component as any).selectedKeys());
    });

    it('should update selectedKeys on left selection change', () => {
      const selectedRows = [component.sampleTestsData[0]];
      component.onLeftSelectionChange(selectedRows);

      expect((component as any).selectedKeys().size).toBe(1);
      expect((component as any).selectedKeys().has('HCV001:1')).toBeTrue();
    });

    it('should clear selectedKeys when empty selection', () => {
      component.onLeftSelectionChange([]);
      expect((component as any).selectedKeys().size).toBe(0);
    });
  });

  describe('Transmit Dropdown Listener', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      setUpAllFields();
      tick();
    }));

    it('should select all when changing to yes with data loaded', () => {
      component.transmitForm.get('transmitTestResults')!.setValue('no');
      expect((component as any).selectedKeys().size).toBe(0);

      component.transmitForm.get('transmitTestResults')!.setValue('yes');
      expect((component as any).selectedKeys().size).toBe(2);
    });

    it('should deselect all when changing to no with data loaded', () => {
      component.transmitForm.get('transmitTestResults')!.setValue('no');
      expect((component as any).selectedKeys().size).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('hasData should be false initially', () => {
      expect((component as any).hasData()).toBeFalse();
    });

    it('hasData should be true when validationData is set', () => {
      (component as any).validationData.set(mockValidateData);
      expect((component as any).hasData()).toBeTrue();
    });

    it('transmitAll should return false when dropdown is null', () => {
      expect((component as any).transmitAll()).toBeFalse();
    });

    it('transmitAll should return true when dropdown is yes at evaluation time', fakeAsync(() => {
      component.transmitForm.get('transmitTestResults')!.setValue('yes');
      fixture = TestBed.createComponent(LinkTestResultsComponent);
      component = fixture.componentInstance;
      component.transmitForm.get('transmitTestResults')!.setValue('yes');
      fixture.detectChanges();
      tick();
      expect((component as any).transmitAll()).toBeTrue();
    }));

    it('allSelected should be false when no tests', () => {
      expect((component as any).allSelected()).toBeFalse();
    });

    it('allSelected should be true when all sample tests selected', fakeAsync(() => {
      setUpAllFields();
      tick();
      expect((component as any).allSelected()).toBeTrue();
    }));

    it('allSelected should be false when some tests deselected', fakeAsync(() => {
      setUpAllFields();
      tick();
      component.onLeftSelectionChange([component.sampleTestsData[0]]);
      expect((component as any).allSelected()).toBeFalse();
    }));

    it('canTransmit should be false when not transmitting but no data', () => {
      expect((component as any).canTransmit()).toBeFalse();
    });

    it('canTransmit should be false when no tests selected', fakeAsync(() => {
      setUpAllFields();
      tick();
      component.onLeftSelectionChange([]);
      expect((component as any).canTransmit()).toBeFalse();
    }));

    it('canTransmit should be true when has data and tests selected', fakeAsync(() => {
      setUpAllFields();
      tick();
      expect((component as any).canTransmit()).toBeTrue();
    }));
  });

  describe('Transmit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      setUpAllFields();
      tick();
      apiServiceSpy.validate.calls.reset();
    }));

    it('should not call transfer when unitId is missing', () => {
      (component as any).parsedUnitId.set(null);
      component.onTransmit();
      expect(apiServiceSpy.transfer).not.toHaveBeenCalled();
    });

    it('should not call transfer when sampleUnitId is missing', () => {
      (component as any).parsedSampleUnitId.set(null);
      component.onTransmit();
      expect(apiServiceSpy.transfer).not.toHaveBeenCalled();
    });

    it('should call transfer API with transferAll=true when all selected', fakeAsync(() => {
      component.onTransmit();
      tick();

      expect(apiServiceSpy.transfer).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sourceUnitId: 'W633319222222',
          targetUnitId: 'W633319111560',
          confirm: true,
          transferAll: true,
        })
      );
    }));

    it('should call transfer API with selectedTests when not all selected', fakeAsync(() => {
      component.onLeftSelectionChange([component.sampleTestsData[0]]);
      component.onTransmit();
      tick();

      const callArgs = apiServiceSpy.transfer.calls.mostRecent().args[0];
      expect(callArgs.transferAll).toBeFalse();
      expect(callArgs.selectedTests).toEqual([{ testId: 'HCV001', testSeqNo: 1 }]);
    }));

    it('should set transmitting during API call', fakeAsync(() => {
      let transmittingDuringCall = false;
      apiServiceSpy.transfer.and.callFake(() => {
        transmittingDuringCall = (component as any).transmitting();
        return of(mockTransferResponse);
      });

      component.onTransmit();
      tick();

      expect(transmittingDuringCall).toBeTrue();
      expect((component as any).transmitting()).toBeFalse();
    }));

    it('should show success snackbar with count on successful transfer', fakeAsync(() => {
      component.onTransmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '2 Tests Transmitted successfully.',
        'DISMISS',
        jasmine.objectContaining({ duration: 0, panelClass: ['success-snackbar'] })
      );
    }));

    it('should clear selection and re-validate after successful transfer', fakeAsync(() => {
      component.onTransmit();
      tick();

      expect((component as any).selectedKeys().size).toBe(0);
      expect(apiServiceSpy.validate).toHaveBeenCalled();
    }));

    it('should use 0 when testResultsTransferred is missing', fakeAsync(() => {
      apiServiceSpy.transfer.and.returnValue(of({
        ...mockTransferResponse,
        data: { ...mockTransferResponse.data, testResultsTransferred: undefined as any },
      }));

      component.onTransmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '0 Tests Transmitted successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle transfer error with error.error.message', fakeAsync(() => {
      apiServiceSpy.transfer.and.returnValue(
        throwError(() => ({ error: { message: 'Transfer server error' } }))
      );

      component.onTransmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Transfer server error',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(loggingServiceSpy.error).toHaveBeenCalled();
    }));

    it('should handle transfer error with error.message fallback', fakeAsync(() => {
      apiServiceSpy.transfer.and.returnValue(
        throwError(() => ({ message: 'Network fail' }))
      );

      component.onTransmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Network fail', 'DISMISS', jasmine.any(Object));
    }));

    it('should handle transfer error with default message', fakeAsync(() => {
      apiServiceSpy.transfer.and.returnValue(throwError(() => ({})));

      component.onTransmit();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Transfer failed. Please try again.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should set transmitting to false on error', fakeAsync(() => {
      apiServiceSpy.transfer.and.returnValue(throwError(() => new Error('fail')));
      component.onTransmit();
      tick();
      expect((component as any).transmitting()).toBeFalse();
    }));
  });

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      setUpAllFields();
      tick();
    }));

    it('should reset all state on onClearAll', () => {
      component.unitIdFieldRef = { clear: jasmine.createSpy('clear') } as any;
      component.sampleUnitIdFieldRef = { clear: jasmine.createSpy('clear') } as any;

      component.onClearAll();

      expect(component.unitIdFieldRef.clear).toHaveBeenCalled();
      expect(component.sampleUnitIdFieldRef.clear).toHaveBeenCalled();
      expect(component.transmitForm.get('transmitTestResults')!.value).toBeNull();
      expect((component as any).parsedUnitId()).toBeNull();
      expect((component as any).parsedSampleUnitId()).toBeNull();
      expect((component as any).validationData()).toBeNull();
      expect(component.sampleTestsData.length).toBe(0);
      expect(component.primaryTestsData.length).toBe(0);
      expect((component as any).selectedKeys().size).toBe(0);
    });

    it('should handle missing ViewChild refs gracefully', () => {
      (component as any).unitIdFieldRef = undefined;
      (component as any).sampleUnitIdFieldRef = undefined;
      expect(() => component.onClearAll()).not.toThrow();
    });
  });

  describe('Chapter Change', () => {
    it('should call onClearAll on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      setUpAllFields();
      tick();

      spyOn(component, 'onClearAll');
      headerServiceMock.chapterChanged$.next();
      tick();

      expect(component.onClearAll).toHaveBeenCalled();
    }));
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Table Data Accessors', () => {
    it('sampleTestsData should return current sampleTests signal value', () => {
      fixture.detectChanges();
      expect(component.sampleTestsData).toEqual([]);

      const rows = mockSampleTests.map(t => ({ ...t, rowKey: `${t.testId}:${t.testSeqNo}` }));
      (component as any).sampleTests.set(rows);
      expect(component.sampleTestsData).toEqual(rows);
    });

    it('primaryTestsData should return current primaryTests signal value', () => {
      fixture.detectChanges();
      expect(component.primaryTestsData).toEqual([]);

      const rows = mockPrimaryTests.map(t => ({ ...t, rowKey: `${t.testId}:${t.testSeqNo}` }));
      (component as any).primaryTests.set(rows);
      expect(component.primaryTestsData).toEqual(rows);
    });
  });

  describe('Transmit Listener Without Data', () => {
    it('should trigger validation when dropdown set before data loads', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitIdValidated(makeUnitValidationResponse('W633319111560'));
      component.onSampleUnitIdValidated(makeUnitValidationResponse('W633319222222'));

      apiServiceSpy.validate.calls.reset();
      component.transmitForm.get('transmitTestResults')!.setValue('yes');
      tick();

      expect(apiServiceSpy.validate).toHaveBeenCalled();
    }));
  });
});
