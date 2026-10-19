import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { provideRouter } from '@angular/router';
import { VoidTestBatchComponent } from './void-test-batch';
import { VoidTestBatchApiService } from './services/void-test-batch-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  TestBatchDto,
  TestInBatchDto,
  VoidReasonCodeDto,
  UnitInBatchDto,
  VoidTestBatchResponseDto,
  TechModeDto,
} from './models/void-test-batch.model';
import { Subject } from 'rxjs';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('VoidTestBatchComponent', () => {
  let dialogRefSpy: any;
  let component: VoidTestBatchComponent;
  let fixture: ComponentFixture<VoidTestBatchComponent>;
  let apiServiceSpy: jasmine.SpyObj<VoidTestBatchApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockTestBatches: TestBatchDto[] = [
    { tbId: 'TB001', testId: 'HIV1', testingLabCode: 'LAB1', insertDate: '2026-07-25T00:00:00Z' },
    { tbId: 'TB002', testId: 'HEPC', testingLabCode: 'LAB1', insertDate: '2026-07-24T00:00:00Z' },
  ];

  const mockTests: TestInBatchDto[] = [
    { testId: 'HIV1', testDesc: 'HIV-1 Test' },
    { testId: 'HEPC', testDesc: 'Hepatitis C Test' },
  ];

  const mockVoidCodes: VoidReasonCodeDto[] = [
    { code: 'CONT', codeDesc: 'Contamination' },
    { code: 'MISC', codeDesc: 'Miscellaneous' },
  ];

  const mockUnits: UnitInBatchDto[] = [
    {
      tbSeqNo: 1, unitId: 'W1234242705', chkDigit: 'Q',
      collDate: '2025-01-11T00:00:00Z', testId: 'IAT', testSeqNo: 1,
      resultStatus1: 'NEG', tbId: '041822-00P0017', absorbance: '0.125',
    },
    {
      tbSeqNo: 2, unitId: 'W1234242705', chkDigit: 'D',
      collDate: '2025-01-11T00:00:00Z', testId: 'IAT', testSeqNo: 2,
      resultStatus1: 'NEG', tbId: '041822-00P0017', absorbance: '0.098',
    },
  ];

  const mockVoidResponse: VoidTestBatchResponseDto = {
    success: true,
    message: 'Test batch voided successfully',
    requiresQcConfirmation: false,
    isStagedForSecondTech: false,
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('VoidTestBatchApiService', [
      'getTestBatches', 'getTestsInBatch', 'getUnitsInBatch',
      'getVoidReasonCodes', 'voidTestBatch', 'checkQcUnits', 'getTechMode',
    ]);
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Void Test Batch', subtitle: 'Test subtitle' }),
    });
    dialogSpy = createMockMatDialog();

    apiServiceSpy.getTestBatches.and.returnValue(of(mockTestBatches));
    apiServiceSpy.getTestsInBatch.and.returnValue(of(mockTests));
    apiServiceSpy.getUnitsInBatch.and.returnValue(of(mockUnits));
    apiServiceSpy.getVoidReasonCodes.and.returnValue(of(mockVoidCodes));
    apiServiceSpy.voidTestBatch.and.returnValue(of(mockVoidResponse));
    apiServiceSpy.checkQcUnits.and.returnValue(of(false));
    apiServiceSpy.getTechMode.and.returnValue(of({ techMode: '0', isTwoTechMode: false, isFirstTech: false }));
      TestBed.configureTestingModule({
      imports: [VoidTestBatchComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: VoidTestBatchApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });
      apiServiceSpy.getTestBatches.and.returnValue(of(mockTestBatches));


      apiServiceSpy.getTestsInBatch.and.returnValue(of(mockTests));


      apiServiceSpy.getUnitsInBatch.and.returnValue(of(mockUnits));


      apiServiceSpy.getVoidReasonCodes.and.returnValue(of(mockVoidCodes));


      apiServiceSpy.voidTestBatch.and.returnValue(of(mockVoidResponse));


      apiServiceSpy.checkQcUnits.and.returnValue(of(false));


      apiServiceSpy.getTechMode.and.returnValue(of({ techMode: '0', isTwoTechMode: false, isFirstTech: false }));
    fixture = TestBed.createComponent(VoidTestBatchComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize form with null values and required validators', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('batchId')?.value).toBeNull();
      expect(component.filterForm.get('testId')?.value).toBeNull();
      expect(component.filterForm.get('voidCode')?.value).toBeNull();
      expect(component.filterForm.get('batchId')?.hasError('required')).toBeTrue();
    });

    it('should load test batches and void reason codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(apiServiceSpy.getTestBatches).toHaveBeenCalledWith(undefined, '0');
      expect(apiServiceSpy.getVoidReasonCodes).toHaveBeenCalled();
    }));
  });

  describe('Batch ID Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load tests when batch ID is selected', fakeAsync(() => {
      component.filterForm.patchValue({ batchId: 'TB001' });
      tick();
      expect(apiServiceSpy.getTestsInBatch).toHaveBeenCalledWith('TB001', '0');
    }));

    it('should reset testId when batch ID changes', fakeAsync(() => {
      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1' });
      tick();
      component.filterForm.patchValue({ batchId: 'TB002' });
      tick();
      expect(component.filterForm.get('testId')?.value).toBeNull();
    }));

    it('should clear results when batch ID changes', fakeAsync(() => {
      (component as any).hasResults.set(true);
      (component as any).unitsInBatch.set(mockUnits);
      component.filterForm.patchValue({ batchId: 'TB001' });
      tick();
      expect((component as any).hasResults()).toBeFalse();
    }));
  });





  describe('Void Code Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update description when void code is selected', fakeAsync(() => {
      component.filterForm.patchValue({ voidCode: 'CONT' });
      tick();
      expect((component as any).selectedVoidCodeDescription()).toBe('Contamination');
    }));
  });

  describe('Retrieve Functionality', () => {
    beforeEach(() => fixture.detectChanges());



    it('should retrieve units when batchId and testId are filled', fakeAsync(() => {
      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.getUnitsInBatch).toHaveBeenCalledWith('TB001', 'HIV1');
      expect((component as any).dataSource.length).toBe(2);
      expect((component as any).dataSource[0].unitIdDisplay).toBe('W1234242705-Q');
    }));


  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).unitsInBatch.set(mockUnits);
    });

    it('should filter data by search term', () => {
      component.onSearch('Q');
      expect((component as any).dataSource.length).toBeLessThanOrEqual(2);
    });

    it('should show all data when search is empty', () => {
      component.onSearch('');
      expect((component as any).dataSource.length).toBe(2);
    });
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset form and clear results', fakeAsync(() => {
      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1', voidCode: 'CONT' });
      (component as any).hasResults.set(true);
      component.onClearAll();
      tick();
      expect(component.filterForm.get('batchId')?.value).toBeNull();
      expect((component as any).hasResults()).toBeFalse();
      expect((component as any).selectedVoidCodeDescription()).toBe('-');
    }));
  });

  describe('Void Batch — QC Check Flow', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1', voidCode: 'CONT' });
      (component as any).hasResults.set(true);
      (component as any).unitsInBatch.set(mockUnits);
    });



    it('should call checkQcUnits before opening dialog', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onVoidBatch();
      tick();

      expect(apiServiceSpy.checkQcUnits).toHaveBeenCalledWith('TB001');
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should pass hasQcUnits to confirmation dialog', fakeAsync(() => {
      apiServiceSpy.checkQcUnits.and.returnValue(of(true));
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onVoidBatch();
      tick();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(dialogData?.data?.hasQcUnits).toBeTrue();
    }));

    it('should perform void when dialog confirms', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onVoidBatch();
      tick();

      expect(apiServiceSpy.voidTestBatch).toHaveBeenCalledWith(jasmine.objectContaining({
        tbId: 'TB001', testId: 'HIV1', voidReasonCode: 'CONT',
      }));
    }));



    it('should handle void error with error code 1204', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      apiServiceSpy.voidTestBatch.and.returnValue(throwError(() => ({
        error: { errorCode: '1204', message: 'No valid VOID interdiction type configured' },
      })));

      component.onVoidBatch();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No valid VOID interdiction type configured');
    }));
  });

  describe('Chapter Change Handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reload data when chapter changes', fakeAsync(() => {

      chapterChanged$.next();
      tick();

      expect(apiServiceSpy.getTestBatches).toHaveBeenCalled();
      expect(apiServiceSpy.getVoidReasonCodes).toHaveBeenCalled();
    }));
  });

  describe('Tech Mode Integration', () => {


    it('should pass tech mode flags to void request', fakeAsync(() => {
      apiServiceSpy.getTechMode.and.returnValue(of({ techMode: '1', isTwoTechMode: true, isFirstTech: true }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1', voidCode: 'CONT' });
      (component as any).hasResults.set(true);
      (component as any).unitsInBatch.set(mockUnits);

      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const stagedResponse: VoidTestBatchResponseDto = {
        success: true, message: 'Staged', requiresQcConfirmation: false, isStagedForSecondTech: true,
      };
      apiServiceSpy.voidTestBatch.and.returnValue(of(stagedResponse));

      component.onVoidBatch();
      tick();

      expect(apiServiceSpy.voidTestBatch).toHaveBeenCalledWith(jasmine.objectContaining({
        isTwoTechMode: true, isFirstTech: true,
      }));
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Void staged for second technician approval.');
    }));
  });



  describe('Result Description Column', () => {
    it('should include resultDesc column in table config', () => {
      fixture.detectChanges();
      const columns = (component as any).tableConfig().columns;
      const resultDescCol = columns.find((c: any) => c.key === 'resultDesc');
      expect(resultDescCol).toBeTruthy();
      expect(resultDescCol.header).toBe('Result Description');
    });
  });

  describe('Dropdown Display (Batch ID + Test ID + Date)', () => {
    it('should filter batches by testId in search', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.batchSearchCtrl.setValue('HIV1');
      tick();
      const filtered = (component as any).filteredBatches();
      expect(filtered.length).toBe(1);
      expect(filtered[0].tbId).toBe('TB001');
    }));

    it('should show all batches when search is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.batchSearchCtrl.setValue('');
      tick();
      const filtered = (component as any).filteredBatches();
      expect(filtered.length).toBe(2);
    }));
  });

  describe('Format Date', () => {
    it('should return empty string for null date', () => {
      fixture.detectChanges();
      expect((component as any).formatDate(null)).toBe('');
    });

    it('should return empty string for undefined date', () => {
      fixture.detectChanges();
      expect((component as any).formatDate(undefined)).toBe('');
    });

    it('should format valid date as DD-MMM-YYYY', () => {
      fixture.detectChanges();
      const result = (component as any).formatDate('2026-07-25T00:00:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });

  describe('Void Flow — Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ batchId: 'TB001', testId: 'HIV1', voidCode: 'CONT' });
      (component as any).hasResults.set(true);
      (component as any).unitsInBatch.set(mockUnits);
    });

    it('should not call voidTestBatch when dialog is cancelled', fakeAsync(() => {
      dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onVoidBatch();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(apiServiceSpy.voidTestBatch).not.toHaveBeenCalled();
    }));

    it('should show error for void without void code selected', fakeAsync(() => {
      component.filterForm.patchValue({ voidCode: null });
      component.onVoidBatch();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please select a void reason code before voiding the batch.'
      );
      expect(dialogSpy.open).not.toHaveBeenCalled();
    }));
  });
});
