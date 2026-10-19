import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';

import { EnterInterimResultCodeComponent } from './enter-interim-result-code.component';
import { InterimResultApiService } from './services/interim-result-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CancelConfirmDialogComponent } from './cancel-confirm-dialog/cancel-confirm-dialog.component';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ContractLookupDto,
  TestLookupDto,
  BatchLookupDto,
  InterimCodeLookupDto,
  UnitInterimResultDto,
  UnitGridRowModel
} from './models/interim-result.model';

describe('EnterInterimResultCodeComponent', () => {
  let dialogRefSpy: any;
  let defaultDialogRef: any;
  let component: any;
  let fixture: ComponentFixture<EnterInterimResultCodeComponent>;
  let apiServiceSpy: jasmine.SpyObj<InterimResultApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockContracts: ContractLookupDto[] = [
    { contractId: 'CONTRACT1', company: 'American Red Cross', centerId: 'CTR001' },
    { contractId: 'CONTRACT2', company: 'Blood Systems Inc', centerId: 'CTR002' },
    { contractId: 'ZZ_OTHER', company: 'Zebra Medical', centerId: 'CTR003' }
  ];

  const mockTests: TestLookupDto[] = [
    { testId: 'HIV', testDescription: 'HIV Antibody Screen' },
    { testId: 'HBV', testDescription: 'Hepatitis B Surface Antigen' },
    { testId: 'HCV', testDescription: 'Hepatitis C Antibody' }
  ];

  const mockBatches: BatchLookupDto[] = [
    { batchId: 'BATCH001', receivedDate: '2024-05-10T00:00:00Z', qcDate: '2024-05-11T00:00:00Z' },
    { batchId: 'BATCH002', receivedDate: '2024-05-12T00:00:00Z', qcDate: '2024-05-13T00:00:00Z' }
  ];

  const mockInterimCodes: InterimCodeLookupDto[] = [
    { code: 'N', codeDescription: 'Normal' },
    { code: 'A', codeDescription: 'Abnormal' },
    { code: 'M', codeDescription: 'Missing Tubes' }
  ];

  const mockUnits: UnitInterimResultDto[] = [
    {
      unitId: 'UNIT001', checkDigit: '5', testId: 'HIV', testSeqNo: 1,
      testDescription: 'HIV Antibody Screen', collDate: '2024-05-15T00:00:00Z',
      chapterId: 'CH001', resultCode: '', resultDescription: ''
    },
    {
      unitId: 'UNIT002', checkDigit: '3', testId: 'HIV', testSeqNo: 1,
      testDescription: 'HIV Antibody Screen', collDate: '2024-05-15T00:00:00Z',
      chapterId: 'CH001', resultCode: '', resultDescription: ''
    },
    {
      unitId: 'UNIT003', checkDigit: null, testId: 'HBV', testSeqNo: 2,
      testDescription: 'Hepatitis B Surface Antigen', collDate: '2024-05-16T00:00:00Z',
      chapterId: 'CH001', resultCode: 'N', resultDescription: 'Normal'
    }
  ];

  function setupAndInit() {
    fixture = TestBed.createComponent(EnterInterimResultCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('InterimResultApiService', [
      'getContracts', 'getTests', 'getBatches', 'getInterimCodes', 'queryUnits', 'saveInterimResults'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({ chapterId: signal('CH001'), chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(undefined)
    });
    dialogSpy = createMockMatDialog();
    defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultDialogRef.afterClosed.and.returnValue(of(false));
    dialogSpy.open.and.returnValue(defaultDialogRef);

    apiServiceSpy.getContracts.and.returnValue(of(mockContracts));
    apiServiceSpy.getTests.and.returnValue(of(mockTests));
    apiServiceSpy.getBatches.and.returnValue(of(mockBatches));
    apiServiceSpy.getInterimCodes.and.returnValue(of(mockInterimCodes));
    apiServiceSpy.queryUnits.and.returnValue(of(mockUnits));
    apiServiceSpy.saveInterimResults.and.returnValue(of({ message: 'Saved successfully', insertedCount: 2 }));

    TestBed.configureTestingModule({
      imports: [EnterInterimResultCodeComponent, NoopAnimationsModule],
      providers: [
        { provide: InterimResultApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).overrideComponent(EnterInterimResultCodeComponent, {
      set: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });
  });

  // ─── Initialization ───────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component).toBeTruthy();
    }));

    it('should initialize form with contractId, testId, interim, batchId controls', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.form.get('contractId')).toBeTruthy();
      expect(component.form.get('testId')).toBeTruthy();
      expect(component.form.get('interim')).toBeTruthy();
      expect(component.form.get('batchId')).toBeTruthy();
    }));

    it('should not have description in form', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.form.get('description')).toBeNull();
    }));

    it('should set contractId as required', fakeAsync(() => {
      setupAndInit();
      tick();
      const ctrl = component.form.get('contractId');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.invalid).toBeTrue();
    }));

    it('should set batchId as required', fakeAsync(() => {
      setupAndInit();
      tick();
      const ctrl = component.form.get('batchId');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      expect(ctrl?.invalid).toBeTrue();
    }));

    it('should load contracts and interim codes on init', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(apiServiceSpy.getContracts).toHaveBeenCalled();
      expect(apiServiceSpy.getInterimCodes).toHaveBeenCalled();
      expect(component.contracts()).toEqual(mockContracts);
      expect(component.interimCodes()).toEqual(mockInterimCodes);
    }));

    it('should not load tests or batches on init', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(apiServiceSpy.getTests).not.toHaveBeenCalled();
      expect(apiServiceSpy.getBatches).not.toHaveBeenCalled();
    }));

    it('should initialize with empty units and hasRetrievedData false', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
    }));

    it('should start with loading signals as false', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.loading()).toBeFalse();
      expect(component.saving()).toBeFalse();
    }));

    it('should have default header config', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.title).toBeDefined();
    }));

    it('should have breadcrumbs array in header config', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.headerConfig.breadcrumbs).toBeDefined();
    }));
  });

  // ─── Contract Selection ───────────────────────────────────────────────────

  describe('Contract Selection', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should populate description signal when contract is selected', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      expect(component.selectedContractDescription()).toBe('American Red Cross');
    }));

    it('should update contract tooltip when contract is selected', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      expect(component.selectedContractTooltip()).toBe('CONTRACT1 - American Red Cross');
    }));

    it('should load tests and batches when contract is selected', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      expect(apiServiceSpy.getTests).toHaveBeenCalledWith('CONTRACT1');
      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('CONTRACT1');
    }));

    it('should clear dependent fields and data when contract changes', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      component.form.patchValue({ testId: 'HIV', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT2' });
      tick();
      expect(component.form.get('testId')?.value).toBeNull();
      expect(component.form.get('batchId')?.value).toBeNull();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
    }));

    it('should clear description when contract is cleared', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      component.form.patchValue({ contractId: null });
      tick();
      expect(component.selectedContractDescription()).toBe('');
    }));

    it('should clear contract tooltip when contract is cleared', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      component.form.patchValue({ contractId: null });
      tick();
      expect(component.selectedContractTooltip()).toBe('');
    }));

    it('should reset search controls when contract changes', fakeAsync(() => {
      component.testSearchCtrl.setValue('HIV');
      component.batchSearchCtrl.setValue('BATCH');
      component.form.patchValue({ contractId: 'CONTRACT1' });
      tick();
      expect(component.testSearchCtrl.value).toBe('');
      expect(component.batchSearchCtrl.value).toBe('');
    }));

    it('should set empty description when selected contract not found in list', fakeAsync(() => {
      component.form.patchValue({ contractId: 'UNKNOWN' });
      tick();
      expect(component.selectedContractDescription()).toBe('');
    }));
  });

  // ─── Interim Filter Changed ───────────────────────────────────────────────

  describe('Interim Filter Changed', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should set interim tooltip when interim value selected', () => {
      component.form.patchValue({ interim: 'N' });
      component.onInterimFilterChanged();
      expect(component.selectedInterimTooltip()).toBe('N - Normal');
    });

    it('should clear interim tooltip when interim cleared', () => {
      component.form.patchValue({ interim: 'N' });
      component.onInterimFilterChanged();
      component.form.patchValue({ interim: null });
      component.onInterimFilterChanged();
      expect(component.selectedInterimTooltip()).toBe('');
    });

    it('should set empty tooltip when interim code not found in list', () => {
      component.form.patchValue({ interim: 'UNKNOWN' });
      component.onInterimFilterChanged();
      expect(component.selectedInterimTooltip()).toBe('');
    });
  });

  // ─── Searchable Dropdown Filtering ────────────────────────────────────────

  describe('Searchable Dropdown Filtering', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    describe('Contract Filter', () => {
      it('should return all contracts when search is empty', () => {
        component.contractSearchCtrl.setValue('');
        expect(component.filteredContracts().length).toBe(mockContracts.length);
      });

      it('should filter contracts by contractId', fakeAsync(() => {
        component.contractSearchCtrl.setValue('CONTRACT1');
        tick();
        expect(component.filteredContracts().length).toBe(1);
        expect(component.filteredContracts()[0].contractId).toBe('CONTRACT1');
      }));

      it('should filter contracts by company name', fakeAsync(() => {
        component.contractSearchCtrl.setValue('Red Cross');
        tick();
        expect(component.filteredContracts().length).toBe(1);
        expect(component.filteredContracts()[0].company).toBe('American Red Cross');
      }));

      it('should be case-insensitive', fakeAsync(() => {
        component.contractSearchCtrl.setValue('blood');
        tick();
        expect(component.filteredContracts().length).toBe(1);
        expect(component.filteredContracts()[0].company).toBe('Blood Systems Inc');
      }));

      it('should return empty array when no match', fakeAsync(() => {
        component.contractSearchCtrl.setValue('NoMatch');
        tick();
        expect(component.filteredContracts().length).toBe(0);
      }));
    });

    describe('Test Filter', () => {
      beforeEach(fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1' });
        tick();
      }));

      it('should return all tests when search is empty', () => {
        component.testSearchCtrl.setValue('');
        expect(component.filteredTests().length).toBe(mockTests.length);
      });

      it('should filter tests by testId', fakeAsync(() => {
        component.testSearchCtrl.setValue('HIV');
        tick();
        expect(component.filteredTests().length).toBe(1);
        expect(component.filteredTests()[0].testId).toBe('HIV');
      }));

      it('should filter tests by description', fakeAsync(() => {
        component.testSearchCtrl.setValue('Hepatitis B');
        tick();
        expect(component.filteredTests().length).toBe(1);
        expect(component.filteredTests()[0].testId).toBe('HBV');
      }));

      it('should match partial text', fakeAsync(() => {
        component.testSearchCtrl.setValue('Hepatitis');
        tick();
        expect(component.filteredTests().length).toBe(2);
      }));
    });

    describe('Interim Code Filter', () => {
      it('should return all interim codes when search is empty', () => {
        component.interimSearchCtrl.setValue('');
        expect(component.filteredInterimCodes().length).toBe(mockInterimCodes.length);
      });

      it('should filter by code', fakeAsync(() => {
        component.interimSearchCtrl.setValue('A');
        tick();
        const filtered = component.filteredInterimCodes();
        expect(filtered.some((c: any) => c.code === 'A')).toBeTrue();
        expect(filtered.length).toBeLessThan(mockInterimCodes.length);
      }));

      it('should filter by description', fakeAsync(() => {
        component.interimSearchCtrl.setValue('Abnormal');
        tick();
        expect(component.filteredInterimCodes().length).toBe(1);
        expect(component.filteredInterimCodes()[0].code).toBe('A');
      }));
    });

    describe('Batch Filter', () => {
      beforeEach(fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1' });
        tick();
      }));

      it('should return all batches when search is empty', () => {
        component.batchSearchCtrl.setValue('');
        expect(component.filteredBatches().length).toBe(mockBatches.length);
      });

      it('should filter batches by batchId', fakeAsync(() => {
        component.batchSearchCtrl.setValue('001');
        tick();
        expect(component.filteredBatches().length).toBe(1);
        expect(component.filteredBatches()[0].batchId).toBe('BATCH001');
      }));
    });

    describe('Grid Interim Code Filter', () => {
      it('should return all codes when search is empty', () => {
        component.gridInterimSearchCtrl.setValue('');
        expect(component.filteredGridInterimCodes().length).toBe(mockInterimCodes.length);
      });

      it('should filter grid interim codes by code', fakeAsync(() => {
        component.gridInterimSearchCtrl.setValue('Missing');
        tick();
        expect(component.filteredGridInterimCodes().length).toBe(1);
        expect(component.filteredGridInterimCodes()[0].code).toBe('M');
      }));

      it('should filter grid interim codes by description', fakeAsync(() => {
        component.gridInterimSearchCtrl.setValue('Missing');
        tick();
        expect(component.filteredGridInterimCodes().length).toBe(1);
        expect(component.filteredGridInterimCodes()[0].codeDescription).toBe('Missing Tubes');
      }));
    });
  });

  // ─── Computed Properties / Getters ────────────────────────────────────────

  describe('Computed Properties', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should compute unitCount from units signal', fakeAsync(() => {
      expect(component.unitCount()).toBe(0);
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      expect(component.unitCount()).toBe(3);
    }));

    it('should compute hasUnsavedChanges from dirty units', fakeAsync(() => {
      expect(component.hasUnsavedChanges()).toBeFalse();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      expect(component.hasUnsavedChanges()).toBeFalse();
      component.onInterimResultChange(component.units()[0], 'N');
      expect(component.hasUnsavedChanges()).toBeTrue();
    }));

    describe('isRetrieveDisabled', () => {
      it('should be disabled when contractId is empty', () => {
        expect(component.isRetrieveDisabled).toBeTrue();
      });

      it('should be disabled when batchId is empty', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1' });
        tick();
        expect(component.isRetrieveDisabled).toBeTrue();
      }));

      it('should be enabled when both contractId and batchId are set', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        expect(component.isRetrieveDisabled).toBeFalse();
      }));

      it('should be disabled while loading', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        const subj = new Subject<UnitInterimResultDto[]>();
        apiServiceSpy.queryUnits.and.returnValue(subj.asObservable());
        component.onRetrieve();
        expect(component.isRetrieveDisabled).toBeTrue();
        subj.next([]);
        subj.complete();
        tick();
      }));
    });

    describe('isClearAllDisabled', () => {
      it('should be disabled when form is empty and no retrieved data', () => {
        expect(component.isClearAllDisabled).toBeTrue();
      });

      it('should be enabled when contractId is set', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1' });
        tick();
        expect(component.isClearAllDisabled).toBeFalse();
      }));

      it('should be enabled after retrieve with data', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        expect(component.isClearAllDisabled).toBeFalse();
      }));
    });

    describe('canCopyInterim', () => {
      it('should be false when no interim value selected', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        expect(component.canCopyInterim).toBeFalse();
      }));

      it('should be false when no units exist', () => {
        component.form.patchValue({ interim: 'N' });
        expect(component.canCopyInterim).toBeFalse();
      });

      it('should be true when interim is set and units exist', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        component.form.patchValue({ interim: 'N' });
        expect(component.canCopyInterim).toBeTrue();
      }));
    });

    describe('canSave', () => {
      it('should be false when no units exist', () => {
        expect(component.canSave).toBeFalse();
      });

      it('should be false when no units have result codes', fakeAsync(() => {
        apiServiceSpy.queryUnits.and.returnValue(of([
          { ...mockUnits[0], resultCode: '' },
          { ...mockUnits[1], resultCode: '' }
        ]));
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        expect(component.canSave).toBeFalse();
      }));

      it('should be true when at least one unit has a result code', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        expect(component.canSave).toBeTrue();
      }));

      it('should be false while saving', fakeAsync(() => {
        component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
        tick();
        component.onRetrieve();
        tick();
        const subj = new Subject<any>();
        apiServiceSpy.saveInterimResults.and.returnValue(subj.asObservable());
        component.onSave();
        expect(component.canSave).toBeFalse();
        subj.next({ message: 'OK', insertedCount: 1 });
        subj.complete();
        tick();
      }));
    });
  });

  // ─── Retrieve Action ──────────────────────────────────────────────────────

  describe('Retrieve Action', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
    }));

    it('should query units successfully', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryUnits).toHaveBeenCalledWith({
        contractId: 'CONTRACT1',
        batchId: 'BATCH001',
        testId: null,
        chapterId: 'CH001'
      });
      expect(component.units().length).toBe(3);
      expect(component.hasRetrievedData()).toBeTrue();
    }));

    it('should pass testId when provided', fakeAsync(() => {
      component.form.patchValue({ testId: 'HIV' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.queryUnits).toHaveBeenCalledWith(
        jasmine.objectContaining({ testId: 'HIV' })
      );
    }));

    it('should set loading flag during request', fakeAsync(() => {
      const subj = new Subject<UnitInterimResultDto[]>();
      apiServiceSpy.queryUnits.and.returnValue(subj.asObservable());
      expect(component.loading()).toBeFalse();
      component.onRetrieve();
      expect(component.loading()).toBeTrue();
      subj.next(mockUnits);
      subj.complete();
      tick();
      expect(component.loading()).toBeFalse();
    }));

    it('should handle query error gracefully', fakeAsync(() => {
      apiServiceSpy.queryUnits.and.returnValue(throwError(() => ({ message: 'Error' })));
      component.onRetrieve();
      tick();
      expect(component.loading()).toBeFalse();
      expect(component.units().length).toBe(0);
    }));

    it('should set originalResultCode on grid rows', fakeAsync(() => {
      component.onRetrieve();
      tick();
      const unit3 = component.units().find((u: any) => u.unitId === 'UNIT003');
      expect(unit3?.originalResultCode).toBe('N');
    }));

    it('should set isDirty to false on all retrieved rows', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(component.units().every((u: any) => u.isDirty === false)).toBeTrue();
    }));

    it('should handle empty results', fakeAsync(() => {
      apiServiceSpy.queryUnits.and.returnValue(of([]));
      component.onRetrieve();
      tick();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeTrue();
    }));
  });

  // ─── Copy Interim Action ──────────────────────────────────────────────────

  describe('Copy Interim Action', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should do nothing if no interim value selected', () => {
      component.onCopyInterim();
      expect(component.units().filter((u: any) => u.resultCode === '').length).toBe(2);
    });

    it('should do nothing if no units exist', () => {
      component.units.set([]);
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      expect(component.units().length).toBe(0);
    });

    it('should copy to all rows when all are empty', fakeAsync(() => {
      apiServiceSpy.queryUnits.and.returnValue(of([mockUnits[0], mockUnits[1]]));
      component.onRetrieve();
      tick();
      component.form.patchValue({ interim: 'N' });
      component.onCopyInterim();
      expect(component.units().every((u: any) => u.resultCode === 'N')).toBeTrue();
      expect(component.units().every((u: any) => u.resultDescription === 'Normal')).toBeTrue();
      expect(component.units().every((u: any) => u.isDirty === true)).toBeTrue();
    }));

    it('should only copy to empty rows, leaving filled rows unchanged', fakeAsync(() => {
      component.form.patchValue({ interim: 'A' });
      component.onCopyInterim();
      const unit1 = component.units().find((u: any) => u.unitId === 'UNIT001');
      const unit3 = component.units().find((u: any) => u.unitId === 'UNIT003');
      expect(unit1?.resultCode).toBe('A');
      expect(unit3?.resultCode).toBe('N');
    }));

    it('should set correct description from interim codes lookup', fakeAsync(() => {
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      const unit1 = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(unit1?.resultDescription).toBe('Missing Tubes');
    }));

    it('should set empty description when code not found in interim codes', fakeAsync(() => {
      component.interimCodes.set([]);
      component.form.patchValue({ interim: 'X' });
      component.onCopyInterim();
      const unit1 = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(unit1?.resultDescription).toBe('');
    }));
  });

  // ─── Save Action ──────────────────────────────────────────────────────────

  describe('Save Action', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      component.form.patchValue({ interim: 'N' });
      component.onCopyInterim();
    }));

    it('should save interim results and show API success message', fakeAsync(() => {
      component.onSave();
      tick();
      expect(apiServiceSpy.saveInterimResults).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Saved successfully');
    }));

    it('should send correct request payload', fakeAsync(() => {
      component.onSave();
      tick();
      const request = apiServiceSpy.saveInterimResults.calls.mostRecent().args[0];
      expect(request.contractId).toBe('CONTRACT1');
      expect(request.batchId).toBe('BATCH001');
      expect(request.chapterId).toBe('CH001');
      expect(request.results.length).toBe(3);
      expect(request.results[0].resultCode).toBe('N');
    }));

    it('should clear grid and reset filters after save', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
      expect(component.form.get('contractId')?.value).toBeNull();
      expect(component.form.get('testId')?.value).toBeNull();
      expect(component.form.get('interim')?.value).toBeNull();
      expect(component.form.get('batchId')?.value).toBeNull();
    }));

    it('should reset all search controls including grid after save', fakeAsync(() => {
      component.contractSearchCtrl.setValue('test');
      component.testSearchCtrl.setValue('test');
      component.interimSearchCtrl.setValue('test');
      component.batchSearchCtrl.setValue('test');
      component.gridInterimSearchCtrl.setValue('test');
      component.onSave();
      tick();
      expect(component.contractSearchCtrl.value).toBe('');
      expect(component.testSearchCtrl.value).toBe('');
      expect(component.interimSearchCtrl.value).toBe('');
      expect(component.batchSearchCtrl.value).toBe('');
      expect(component.gridInterimSearchCtrl.value).toBe('');
    }));

    it('should reset tooltip signals after save', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.selectedContractTooltip()).toBe('');
      expect(component.selectedInterimTooltip()).toBe('');
      expect(component.selectedContractDescription()).toBe('');
    }));

    it('should clear tests and batches signals after save', fakeAsync(() => {
      component.onSave();
      tick();
      expect(component.tests().length).toBe(0);
      expect(component.batches().length).toBe(0);
    }));

    it('should only save units with result codes', fakeAsync(() => {
      const units = component.units();
      component.onInterimResultChange(units[0], '');
      component.onSave();
      tick();
      const request = apiServiceSpy.saveInterimResults.calls.mostRecent().args[0];
      expect(request.results.length).toBe(2);
    }));

    it('should not call save when no units have result codes', fakeAsync(() => {
      component.units.set(component.units().map((u: any) => ({ ...u, resultCode: '' })));
      component.onSave();
      tick();
      expect(apiServiceSpy.saveInterimResults).not.toHaveBeenCalled();
    }));

    it('should set saving flag during request', fakeAsync(() => {
      const subj = new Subject<any>();
      apiServiceSpy.saveInterimResults.and.returnValue(subj.asObservable());
      expect(component.saving()).toBeFalse();
      component.onSave();
      expect(component.saving()).toBeTrue();
      subj.next({ message: 'OK', insertedCount: 1 });
      subj.complete();
      tick();
      expect(component.saving()).toBeFalse();
    }));

    it('should handle save error gracefully', fakeAsync(() => {
      apiServiceSpy.saveInterimResults.and.returnValue(throwError(() => ({ message: 'Error' })));
      component.onSave();
      tick();
      expect(component.saving()).toBeFalse();
    }));
  });

  // ─── Cancel Action ────────────────────────────────────────────────────────

  describe('Cancel Action', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should clear grid without dialog if no unsaved changes', () => {
      component.onCancel();
      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
    });

    it('should show dialog when there are unsaved changes', fakeAsync(() => {
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      component.onCancel();
      tick();
      expect(dialogSpy.open).toHaveBeenCalledWith(CancelConfirmDialogComponent, jasmine.any(Object));
    }));

    it('should clear grid when user clicks YES', fakeAsync(() => {
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.onCancel();
      tick();
      expect(component.units().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
    }));

    it('should keep data when user clicks NO', fakeAsync(() => {
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      const unitCount = component.units().length;
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.onCancel();
      tick();
      expect(component.units().length).toBe(unitCount);
    }));

    it('should open dialog with correct config', fakeAsync(() => {
      component.form.patchValue({ interim: 'M' });
      component.onCopyInterim();
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      component.onCancel();
      tick();
      expect(dialogSpy.open).toHaveBeenCalledWith(CancelConfirmDialogComponent, {
        width: '464px',
        disableClose: true,
        panelClass: 'cancel-confirm-dialog'
      });
    }));
  });

  // ─── Clear All Action ─────────────────────────────────────────────────────

  describe('Clear All Action', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should reset form and clear all data', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      component.onClearAll();
      expect(component.form.get('contractId')?.value).toBeNull();
      expect(component.form.get('testId')?.value).toBeNull();
      expect(component.form.get('interim')?.value).toBeNull();
      expect(component.form.get('batchId')?.value).toBeNull();
      expect(component.units().length).toBe(0);
      expect(component.tests().length).toBe(0);
      expect(component.batches().length).toBe(0);
      expect(component.hasRetrievedData()).toBeFalse();
      expect(component.selectedContractDescription()).toBe('');
    }));

    it('should reset all search controls including grid', fakeAsync(() => {
      component.contractSearchCtrl.setValue('test');
      component.testSearchCtrl.setValue('test');
      component.interimSearchCtrl.setValue('test');
      component.batchSearchCtrl.setValue('test');
      component.gridInterimSearchCtrl.setValue('test');
      component.onClearAll();
      expect(component.contractSearchCtrl.value).toBe('');
      expect(component.testSearchCtrl.value).toBe('');
      expect(component.interimSearchCtrl.value).toBe('');
      expect(component.batchSearchCtrl.value).toBe('');
      expect(component.gridInterimSearchCtrl.value).toBe('');
    }));

    it('should reset tooltip signals', () => {
      component.onClearAll();
      expect(component.selectedContractTooltip()).toBe('');
      expect(component.selectedInterimTooltip()).toBe('');
    });
  });

  // ─── Grid Interim Result Change ───────────────────────────────────────────

  describe('Grid Interim Result Change', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should update specific unit result code and description', () => {
      const unit = component.units()[0];
      component.onInterimResultChange(unit, 'A');
      const updated = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(updated?.resultCode).toBe('A');
      expect(updated?.resultDescription).toBe('Abnormal');
      expect(updated?.isDirty).toBeTrue();
    });

    it('should not affect other units', () => {
      component.onInterimResultChange(component.units()[0], 'A');
      const other = component.units().find((u: any) => u.unitId === 'UNIT002');
      expect(other?.resultCode).toBe('');
      expect(other?.isDirty).toBeFalsy();
    });

    it('should clear result code when empty string is set', () => {
      const unit = component.units()[2];
      component.onInterimResultChange(unit, '');
      const updated = component.units().find((u: any) => u.unitId === 'UNIT003');
      expect(updated?.resultCode).toBe('');
      expect(updated?.resultDescription).toBe('');
    });

    it('should set isDirty based on comparison with originalResultCode', () => {
      const unit = component.units()[2];
      component.onInterimResultChange(unit, 'A');
      expect(component.units().find((u: any) => u.unitId === 'UNIT003')?.isDirty).toBeTrue();
      component.onInterimResultChange(component.units().find((u: any) => u.unitId === 'UNIT003')!, 'N');
      expect(component.units().find((u: any) => u.unitId === 'UNIT003')?.isDirty).toBeFalse();
    });

    it('should set empty description when code not found', () => {
      component.interimCodes.set([]);
      const unit = component.units()[0];
      component.onInterimResultChange(unit, 'X');
      const updated = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(updated?.resultDescription).toBe('');
    });
  });

  // ─── Sort Change ──────────────────────────────────────────────────────────

  describe('Sort Change', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should sort ascending by column', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      const ids = component.units().map((u: any) => u.unitId);
      expect(ids).toEqual(['UNIT001', 'UNIT002', 'UNIT003']);
    });

    it('should sort descending by column', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      const ids = component.units().map((u: any) => u.unitId);
      expect(ids).toEqual(['UNIT003', 'UNIT002', 'UNIT001']);
    });

    it('should restore original order on default direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      component.onSortChange({ column: 'unitId', direction: 'default' });
      const ids = component.units().map((u: any) => u.unitId);
      expect(ids).toEqual(['UNIT001', 'UNIT002', 'UNIT003']);
    });

    it('should update tableConfig sortConfig', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig).toEqual({ column: 'unitId', direction: 'A' });
    });

    it('should preserve dirty state during sort', () => {
      component.onInterimResultChange(component.units()[0], 'A');
      component.onSortChange({ column: 'unitId', direction: 'D' });
      const unit1 = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(unit1?.isDirty).toBeTrue();
      expect(unit1?.resultCode).toBe('A');
    });

    it('should preserve modifications after restore to default', () => {
      component.onInterimResultChange(component.units()[0], 'M');
      component.onSortChange({ column: 'unitId', direction: 'D' });
      component.onSortChange({ column: 'unitId', direction: 'default' });
      const unit1 = component.units().find((u: any) => u.unitId === 'UNIT001');
      expect(unit1?.resultCode).toBe('M');
    });
  });

  // ─── Chapter Change Subscription ──────────────────────────────────────────

  describe('Chapter Change Subscription', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001', testId: 'HIV' });
      tick();
      component.onRetrieve();
      tick();
    }));

    it('should clear form and reload LOVs on chapter change', fakeAsync(() => {
      chapterChanged$.next();
      tick();
      expect(component.form.get('contractId')?.value).toBeNull();
      expect(component.units().length).toBe(0);
      expect(apiServiceSpy.getContracts).toHaveBeenCalled();
      expect(apiServiceSpy.getInterimCodes).toHaveBeenCalled();
    }));

    it('should reset hasRetrievedData on chapter change', fakeAsync(() => {
      chapterChanged$.next();
      tick();
      expect(component.hasRetrievedData()).toBeFalse();
    }));
  });

  // ─── LOV Loading Error Handling ───────────────────────────────────────────

  describe('LOV Loading Error Handling', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should reset loading flag on contract load error', fakeAsync(() => {
      apiServiceSpy.getContracts.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadContracts']();
      tick();
      expect(component.loadingContracts()).toBeFalse();
    }));

    it('should reset loading flag on tests load error', fakeAsync(() => {
      apiServiceSpy.getTests.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadTests']('CONTRACT1');
      tick();
      expect(component.loadingTests()).toBeFalse();
    }));

    it('should reset loading flag on batches load error', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadBatches']('CONTRACT1');
      tick();
      expect(component.loadingBatches()).toBeFalse();
    }));

    it('should reset loading flag on interim codes load error', fakeAsync(() => {
      apiServiceSpy.getInterimCodes.and.returnValue(throwError(() => ({ message: 'Error' })));
      component['loadInterimCodes']();
      tick();
      expect(component.loadingInterimCodes()).toBeFalse();
    }));

    it('should set loading flag before API call starts', fakeAsync(() => {
      const subj = new Subject<ContractLookupDto[]>();
      apiServiceSpy.getContracts.and.returnValue(subj.asObservable());
      component['loadContracts']();
      expect(component.loadingContracts()).toBeTrue();
      subj.next([]);
      subj.complete();
      tick();
      expect(component.loadingContracts()).toBeFalse();
    }));
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  describe('Lifecycle', () => {
    it('should call ngAfterViewInit to initialize table config', fakeAsync(() => {
      setupAndInit();
      tick();
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(5);
    }));

    it('should set unitId column as sortable', fakeAsync(() => {
      setupAndInit();
      tick();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol?.sortable).toBeTrue();
    }));

    it('should set non-sortable columns correctly', fakeAsync(() => {
      setupAndInit();
      tick();
      const testIdCol = component.tableConfig.columns.find((c: any) => c.key === 'testId');
      expect(testIdCol?.sortable).toBeFalse();
    }));

    it('should clean up subscriptions on destroy', fakeAsync(() => {
      setupAndInit();
      tick();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  // ─── Table Header Update ──────────────────────────────────────────────────

  describe('Table Header Update', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should update unit ID column header with count', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol?.header).toContain('3');
    }));

    it('should show 0 count after clear', fakeAsync(() => {
      component.form.patchValue({ contractId: 'CONTRACT1', batchId: 'BATCH001' });
      tick();
      component.onRetrieve();
      tick();
      component.onCancel();
      const unitIdCol = component.tableConfig.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol?.header).toContain('0');
    }));
  });

  // ─── Value Formatter ──────────────────────────────────────────────────────

  describe('Value Formatter', () => {
    beforeEach(fakeAsync(() => {
      setupAndInit();
      tick();
    }));

    it('should format unitId with check digit', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter;
      if (formatter) {
        const result = formatter('UNIT001', { checkDigit: '5' } as any);
        expect(result).toBe('UNIT001-5');
      }
    });

    it('should return unitId without dash when checkDigit is null', () => {
      const formatter = component.tableConfig.columns[0].valueFormatter;
      if (formatter) {
        const result = formatter('UNIT003', { checkDigit: null } as any);
        expect(result).toBe('UNIT003');
      }
    });
  });
});
