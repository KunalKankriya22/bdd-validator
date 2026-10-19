import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { WksComponent } from './wks.component';
import { WksService } from './wks.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  TestBatchDto,
  TestBatchDetailDto,
  TestBatchUnitDto,
  CreateTestBatchRequestDto,
} from './wks.models';

describe('WksComponent', () => {
  let component: WksComponent;
  let fixture: ComponentFixture<WksComponent>;
  let wksServiceSpy: jasmine.SpyObj<WksService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockTestBatch: TestBatchDto = {
    tbId: '2026-1234-TB',
    testChapterId: 'CHAP',
    startWorkNumber: 1,
    testingLabCode: '99',
    insertDate: '2026-06-22T10:00:00Z',
    insertUser: 'USER01',
    tests: [
      {
        testId: 'ABO',
        testKitId: 'KIT-001',
        testDesc: 'ABO Blood Type',
        testGroup: 'BLOOD',
      },
      {
        testId: 'RH',
        testKitId: 'KIT-002',
        testDesc: 'Rh Factor',
        testGroup: 'BLOOD',
      },
    ],
    units: [
      {
        seqNo: 1,
        unitId: '1234567890123',
        collDate: '2026-06-20T00:00:00Z',
        chapterId: 'CHAP',
        checkDigit: '45',
      },
      {
        seqNo: 2,
        unitId: '1234567890124',
        collDate: '2026-06-21T00:00:00Z',
        chapterId: 'CHAP',
        checkDigit: '67',
      },
    ],
  };

  beforeEach(() => {

    wksServiceSpy = jasmine.createSpyObj('WksService', [
      'getTestBatch',
      'createTestBatch',
      'updateTestBatch',
      'addTestToBatch',
      'addUnitToBatch',
      'removeTestFromBatch',
      'removeUnitFromBatch',
      'getTestBatches',
      'getAvailableTests',
      'getLabCodes',
      'getTestKits',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => ({
        title: 'Create Test Batch/Worksheet',
        subtitle: 'Create a worksheet for a test batch or to add units to an existing worksheet.',
      }),
    });
    dialogSpy = createMockMatDialog();

    // Default service return values
    wksServiceSpy.getTestBatches.and.returnValue(of([]));
    wksServiceSpy.getAvailableTests.and.returnValue(of([]));
    wksServiceSpy.getLabCodes.and.returnValue(of([]));
    wksServiceSpy.getTestBatch.and.returnValue(of(mockTestBatch));
    wksServiceSpy.createTestBatch.and.returnValue(of(mockTestBatch));



      TestBed.configureTestingModule({
      imports: [WksComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WksService, useValue: wksServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    })
    .overrideComponent(WksComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      wksServiceSpy.getTestBatch.calls.reset();


      wksServiceSpy.createTestBatch.calls.reset();


      wksServiceSpy.updateTestBatch.calls.reset();


      wksServiceSpy.addTestToBatch.calls.reset();


      wksServiceSpy.addUnitToBatch.calls.reset();


      wksServiceSpy.removeTestFromBatch.calls.reset();


      wksServiceSpy.removeUnitFromBatch.calls.reset();


      wksServiceSpy.getTestBatches.calls.reset();


      wksServiceSpy.getAvailableTests.calls.reset();


      wksServiceSpy.getLabCodes.calls.reset();


      wksServiceSpy.getTestKits.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      dialogSpy.open.calls.reset();


      wksServiceSpy.getTestBatches.and.returnValue(of([]));


      wksServiceSpy.getAvailableTests.and.returnValue(of([]));


      wksServiceSpy.getLabCodes.and.returnValue(of([]));


      wksServiceSpy.getTestBatch.and.returnValue(of(mockTestBatch));


      wksServiceSpy.createTestBatch.and.returnValue(of(mockTestBatch));


    fixture = TestBed.createComponent(WksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    (component as any).unitIdField = { clear: jest.fn() };


    });

  describe('Form Validation', () => {
    it('should require starting sequence', () => {
      component.form.get('startingSequence')?.setValue(null);
      expect(component.form.get('startingSequence')?.hasError('required')).toBe(true);
    });

    it('should require starting sequence >= 1', () => {
      component.form.get('startingSequence')?.setValue(0);
      expect(component.form.get('startingSequence')?.hasError('min')).toBe(true);
    });

    it('should require starting sequence <= 9999', () => {
      component.form.get('startingSequence')?.setValue(10000);
      expect(component.form.get('startingSequence')?.hasError('max')).toBe(true);
    });

    it('should require testing lab code', () => {
      component.form.get('testingLabCode')?.setValue('');
      expect(component.form.get('testingLabCode')?.hasError('required')).toBe(true);
    });

    it('should limit testing lab code to 2 characters', () => {
      component.form.get('testingLabCode')?.setValue('ABC');
      expect(component.form.get('testingLabCode')?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Retrieve Test Batch', () => {
    it('should retrieve batch when batch ID is selected', fakeAsync(() => {
      component.form.get('testBatchId')?.setValue('2026-1234-TB');
      component.onRetrieve();
      tick();

      expect(wksServiceSpy.getTestBatch).toHaveBeenCalledWith('2026-1234-TB');
      expect(component.currentBatchId()).toBe('2026-1234-TB');
      expect(component.tests().length).toBe(2);
      expect(component.units().length).toBe(2);
    }));






  });

  describe('Create New Batch', () => {
    beforeEach(() => {
      component.form.patchValue({
        startingSequence: 1,
        testingLabCode: '99',
      });
    });

    it('should create batch with tests and units', fakeAsync(() => {
      component.onAddTest();
      component.tests.update((tests) =>
        tests.map((t, i) => (i === 0 ? { ...t, testId: 'ABO', testDesc: 'ABO Blood Type' } : t))
      );

      component.onCreateNewBatch();
      tick();

      expect(wksServiceSpy.createTestBatch).toHaveBeenCalled();
      const request: CreateTestBatchRequestDto = wksServiceSpy.createTestBatch.calls.argsFor(0)[0];
      expect(request.startWorkNumber).toBe(1);
      expect(request.testingLabCode).toBe('99');
      expect(request.tests?.length).toBeGreaterThan(0);
    }));







    it('should handle creation error', fakeAsync(() => {
      const error = { error: { errorResponse: { error: 'Invalid data' } } };
      wksServiceSpy.createTestBatch.and.returnValue(throwError(() => error));

      component.onAddTest();
      component.tests.update((tests) =>
        tests.map((t, i) => (i === 0 ? { ...t, testId: 'ABO' } : t))
      );

      component.onCreateNewBatch();
      tick();

      expect(component.saving()).toBe(false);
    }));
  });

  describe('Test Management', () => {
    it('should add new test row', () => {
      const initialLength = component.tests().length;
      component.onAddTest();

      expect(component.tests().length).toBe(initialLength + 1);
      expect(component.tests()[0].isNew).toBe(true);
    });

    it('should update test when selection changes', () => {
      component.onAddTest();
      const firstTest = component.tests()[0];

      component.onTestChange(firstTest, 'ABO');

      const updatedTest = component.tests()[0];
      expect(updatedTest.testId).toBe('ABO');
    });



    it('should call API to remove existing test', fakeAsync(() => {
      wksServiceSpy.removeTestFromBatch.and.returnValue(of(true));
      component.currentBatchId.set('2026-1234-TB');

      component.tests.set([
        {
          id: 'test-1',
          testId: 'ABO',
          testDesc: 'ABO Blood Type',
          testKitId: null,
          isNew: false,
          availableTests: [],
          availableKits: [],
        },
      ]);

      const firstTest = component.tests()[0];
      component.onRemoveTest(firstTest);
      tick();

      expect(wksServiceSpy.removeTestFromBatch).toHaveBeenCalledWith('2026-1234-TB', 'ABO');
    }));
  });

  describe('Unit Management', () => {
    const makeUnitValidation = (unitId: string) => ({
      parsedUnitId: unitId,
      checkDigit: null,
      codeScheme: 'I' as const,
      manualUnitId: unitId,
      codabarUnitScheme: null,
      entryMode: 'S' as const,
      barcodeType: 'CODE128' as const,
      chapterScheme: 'I' as const,
    });

    it('should add unit when scanned', fakeAsync(() => {
      component.form.patchValue({ startingSequence: 1 });
      component.onUnitValidated(makeUnitValidation('1234567890123'));
      tick();

      expect(component.units().length).toBe(1);
      expect(component.units()[0].unitId).toBe('1234567890123');
      expect(component.units()[0].seqNo).toBe(1);
    }));

    it('should prevent duplicate units', () => {
      component.units.set([
        {
          id: 'unit-1',
          seqNo: 1,
          unitId: '1234567890123',
          collDate: null,
          isNew: true,
        },
      ]);

      component.onUnitValidated(makeUnitValidation('1234567890123'));

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('This unit is already in the batch.');
      expect(component.units().length).toBe(1);
    });



    it('should remove unit from UI if new', () => {
      component.units.set([
        {
          id: 'unit-1',
          seqNo: 1,
          unitId: '1234567890123',
          collDate: null,
          isNew: true,
        },
      ]);

      const firstUnit = component.units()[0];
      component.onRemoveUnit(firstUnit);

      expect(component.units().length).toBe(0);
    });

    it('should call API to remove existing unit', fakeAsync(() => {
      wksServiceSpy.removeUnitFromBatch.and.returnValue(of(true));
      component.currentBatchId.set('2026-1234-TB');

      component.units.set([
        {
          id: 'unit-1',
          seqNo: 1,
          unitId: '1234567890123',
          collDate: null,
          isNew: false,
        },
      ]);

      const firstUnit = component.units()[0];
      component.onRemoveUnit(firstUnit);
      tick();

      expect(wksServiceSpy.removeUnitFromBatch).toHaveBeenCalledWith('2026-1234-TB', '1234567890123');
    }));


  });

  describe('Clear Functionality', () => {
    it('should reset form and state', () => {
      component.form.patchValue({
        testBatchId: '2026-1234-TB',
        startingSequence: 10,
        testingLabCode: '99',
      });
      component.tests.set([
        {
          id: 'test-1',
          testId: 'ABO',
          testDesc: 'ABO',
          testKitId: null,
          isNew: true,
          availableTests: [],
        },
      ]);
      component.units.set([
        {
          id: 'unit-1',
          seqNo: 1,
          unitId: '1234567890123',
          collDate: null,
          isNew: true,
        },
      ]);

      component.onClear();

      expect(component.form.get('testBatchId')?.value).toBeNull();
      expect(component.form.get('startingSequence')?.value).toBe(1);
      expect(component.form.get('testingLabCode')?.value).toBe('');
      expect(component.tests().length).toBe(0);
      expect(component.units().length).toBe(0);
      expect(component.currentBatchId()).toBeNull();
    });
  });

  describe('Computed States', () => {
    it('should correctly compute hasTests', () => {
      expect(component.hasTests()).toBe(false);

      component.onAddTest();
      expect(component.hasTests()).toBe(true);
    });

    it('should correctly compute hasUnits', () => {
      expect(component.hasUnits()).toBe(false);

      component.units.set([
        {
          id: 'unit-1',
          seqNo: 1,
          unitId: '1234567890123',
          collDate: null,
          isNew: true,
        },
      ]);
      expect(component.hasUnits()).toBe(true);
    });

    it('should correctly compute hasData', () => {
      expect(component.hasData()).toBe(false);

      component.onAddTest();
      expect(component.hasData()).toBe(true);
    });

    it('should correctly compute canSave', () => {
      component.form.patchValue({
        startingSequence: 1,
        testingLabCode: '99',
      });
      component.onAddTest();

      expect(component.canSave()).toBe(true);
    });



    it('should prevent save when no data', () => {
      component.form.patchValue({
        startingSequence: 1,
        testingLabCode: '99',
      });

      expect(component.canSave()).toBe(false);
    });
  });
});
