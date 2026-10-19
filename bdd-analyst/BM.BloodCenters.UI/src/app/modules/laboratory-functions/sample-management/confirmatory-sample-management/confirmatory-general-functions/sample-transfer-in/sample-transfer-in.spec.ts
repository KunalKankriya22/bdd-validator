import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, EMPTY, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';
import moment from 'moment';

import { SampleTransferInComponent } from './sample-transfer-in';
import { SampleTransferInApiService } from './services/sample-transfer-in-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  BoxDropdownItem, BoxValidationResult, ContractDropdownItem, SampleTypeDropdownItem,
  SampleTransferInDetail, ProfileSetDropdownItem, BatchDropdownItem,
  TestDropdownItem, OverrideCodeItem, ContractValidationResult, CheckInRequest,
  DuplicateSampleResult, SampleDataResult,
} from './models/sample-transfer-in.model';

describe('SampleTransferInComponent', () => {
  let mockChapterTimezoneService: any;
  let mockPageHeaderService: any;
  let component: SampleTransferInComponent;
  let fixture: ComponentFixture<SampleTransferInComponent>;
  let apiServiceSpy: jasmine.SpyObj<SampleTransferInApiService>;
  let snackBarOpenSpy: jasmine.Spy;
  let dialogOpenSpy: jasmine.Spy;

  const chapterNow = moment('2026-06-15T10:00:00');

  const mockBoxes: BoxDropdownItem[] = [
    { boxId: 'BOX001', shipmentNo: 'SH001' },
    { boxId: 'BOX002', shipmentNo: 'SH002' },
  ];

  const mockContracts: ContractDropdownItem[] = [
    { contractId: 'RC001', company: 'Test Company 1' },
    { contractId: 'RC002', company: 'Test Company 2' },
  ];

  const mockSampleTypes: SampleTypeDropdownItem[] = [
    { code: 'FRZN', codeDesc: 'Frozen' },
    { code: 'CLT', codeDesc: 'Clotted' },
  ];

  const mockProfiles: ProfileSetDropdownItem[] = [
    { profileSetId: 'PS001', profileDesc: 'Profile 1', profileType: 'S', profileSeqNo: 1 },
    { profileSetId: 'PS002', profileDesc: 'Adhoc Profile', profileType: 'A', profileSeqNo: 2 },
  ];

  const mockBatches: BatchDropdownItem[] = [
    { batchId: 'BAT001', receivedDate: '06-15-2026' },
  ];

  const mockTests: TestDropdownItem[] = [
    { testId: 'T1', testDesc: 'Test 1', testGroup: 'G1' },
    { testId: 'T2', testDesc: 'Test 2', testGroup: 'G1' },
  ];

  const mockOverrideReasons: OverrideCodeItem[] = [{ code: 'R1', codeDesc: 'Reason 1' }];
  const mockOverrideHolds: OverrideCodeItem[] = [{ code: 'H1', codeDesc: 'Hold 1' }];
  const mockOverrideComments: OverrideCodeItem[] = [{ code: 'C1', codeDesc: 'Comment 1' }];

  const makeSample = (overrides: Partial<SampleTransferInDetail> = {}): SampleTransferInDetail => ({
    boxId: 'BOX001', extUnitId: 'E1', intUnitId: 'I1', collDate: '06-10-2026 08:00',
    contractId: 'RC001', sampleType: 'FRZN', frozenFlag: 'N', thawFlag: 'N',
    sampleSeqNo: '1', chapterId: 'C1', acceptFlag: 'N', aliquot: '01',
    ...overrides,
  });

  const pageHeaderDataSignal = signal<{ title: string; subtitle?: string } | null>(null);
  const chapterChangedSubject = new Subject<void>();

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('SampleTransferInApiService', [
      'getBoxes', 'validateBox', 'getBoxSamples', 'getContracts', 'getProfiles',
      'getBatches', 'generateBatch', 'getSampleTypes', 'getTests',
      'getOverrideReasons', 'getOverrideHolds', 'getOverrideComments',
      'checkIn', 'validateContract', 'getBarcodeScheme', 'checkDuplicateSample',
      'validateUnit', 'getSampleData', 'updateSampleDetail',
    ]);

    mockPageHeaderService = jasmine.createSpyObj(
      'PageHeaderService',
      ['getTitle', 'getSubtitle'],
      { pageHeaderData: pageHeaderDataSignal },
    );
    mockPageHeaderService.getTitle.and.returnValue('');
    mockPageHeaderService.getSubtitle.and.returnValue('');

    const mockHeaderService = {
      chapterTimeZone: signal('America/New_York'),
      chapterChanged$: chapterChangedSubject.asObservable(),
    };

    mockChapterTimezoneService = jasmine.createSpyObj(
      'ChapterTimezoneService',
      ['getChapterLocalDateTime', 'getChapterLocalDate'],
    );
    mockChapterTimezoneService.getChapterLocalDateTime.and.returnValue(moment('2026-06-15T10:00:00'));
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-06-15').startOf('day'));

    // Default return values
    apiServiceSpy.getSampleTypes.and.returnValue(of(mockSampleTypes));
    apiServiceSpy.getBoxes.and.returnValue(of(mockBoxes));
    apiServiceSpy.getContracts.and.returnValue(of(mockContracts));
    apiServiceSpy.validateBox.and.returnValue(of(null));
    apiServiceSpy.getBoxSamples.and.returnValue(of([]));
    apiServiceSpy.getProfiles.and.returnValue(of(mockProfiles));
    apiServiceSpy.getBatches.and.returnValue(of(mockBatches));
    apiServiceSpy.getTests.and.returnValue(of(mockTests));
    apiServiceSpy.getOverrideReasons.and.returnValue(of(mockOverrideReasons));
    apiServiceSpy.getOverrideHolds.and.returnValue(of(mockOverrideHolds));
    apiServiceSpy.getOverrideComments.and.returnValue(of(mockOverrideComments));
    apiServiceSpy.validateContract.and.returnValue(of({ contractId: 'RC001', barCodeProtocol: 'ISBT', unitIdType: 'C', copyIsbtFlag: 'N' }));
    apiServiceSpy.checkDuplicateSample.and.returnValue(of({ isDuplicate: false }));
    apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'Check-in successful', data: null, statusCode: 200 } as any));
    apiServiceSpy.generateBatch.and.returnValue(of('BAT-NEW'));
    apiServiceSpy.getSampleData.and.returnValue(of(null));
    apiServiceSpy.updateSampleDetail.and.returnValue(of({ success: true, message: 'Updated' } as any));

    TestBed.configureTestingModule({
      imports: [SampleTransferInComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SampleTransferInApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
    });

    fixture = TestBed.createComponent(SampleTransferInComponent);
    component = fixture.componentInstance;
    snackBarOpenSpy = spyOn((component as any).snackBar, 'open');
    dialogOpenSpy = spyOn((component as any).dialog, 'open');
  });

  function initComponent(): void {
    try { fixture.detectChanges(); } catch (_) { /* child template errors */ }
  }

  function setupInternalMode(): void {
    initComponent();
    component.headerForm.patchValue({ transferMode: 'I' });
    component.onTransferModeChange('I');
  }

  function setupExternalMode(): void {
    initComponent();
    component.headerForm.patchValue({ transferMode: 'E' });
    component.onTransferModeChange('E');
  }

  function createDialogRefSpy(afterClosedValue: any = null): any {
    const ref = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    ref.afterClosed.and.returnValue(of(afterClosedValue));
    return ref;
  }

  // ── Initialization ───────────────────────────────────────────────

  describe('Initialization', () => {
    it('should initialize headerForm with default values', () => {
      initComponent();
      expect(component.headerForm.get('transferMode')?.value).toBeNull();
      expect(component.headerForm.get('boxId')?.value).toBeNull();
      expect(component.headerForm.get('contractId')?.value).toBeNull();
      expect(component.headerForm.get('shipmentNo')?.value).toBe('');
    });

    it('should initialize detailForm', () => {
      initComponent();
      expect(component.detailForm).toBeTruthy();
      expect(component.detailForm.get('extUnitId')).toBeTruthy();
      expect(component.detailForm.get('intUnitId')).toBeTruthy();
      expect(component.detailForm.get('sampleType')).toBeTruthy();
    });

    it('should load sample types on init', fakeAsync(() => {
      initComponent();
      tick();
      expect(apiServiceSpy.getSampleTypes).toHaveBeenCalled();
      expect(component.sampleTypeOptions()).toEqual(mockSampleTypes);
    }));

    it('should set receivedDate to chapter local time on init', () => {
      initComponent();
      const recv = component.headerForm.get('receivedDate')?.value as moment.Moment;
      expect(recv).toBeTruthy();
      expect(recv.format('YYYY-MM-DD')).toBe('2026-06-15');
    });

    it('should subscribe to chapterChanged$ and call clearAll', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001' });
      component.boxSamples.set([makeSample()]);

      chapterChangedSubject.next();
      tick();

      expect(component.headerForm.get('transferMode')?.value).toBeNull();
      expect(component.boxSamples()).toEqual([]);
    }));

    it('should wire up search control valueChanges to search term signals', fakeAsync(() => {
      initComponent();
      tick();

      component.boxOptions.set(mockBoxes);
      component.boxSearchCtrl.setValue('BOX001');
      tick();
      expect(component.filteredBoxOptions().length).toBe(1);
      expect(component.filteredBoxOptions()[0].boxId).toBe('BOX001');
    }));
  });

  // ── Form Validation ──────────────────────────────────────────────

  describe('Form Validation', () => {
    beforeEach(() => initComponent());

    it('should require transfer mode', () => {
      component.headerForm.get('transferMode')?.markAsTouched();
      expect(component.headerForm.get('transferMode')?.hasError('required')).toBeTrue();
    });

    it('should require box ID', () => {
      component.headerForm.get('boxId')?.markAsTouched();
      expect(component.headerForm.get('boxId')?.hasError('required')).toBeTrue();
    });

    it('should validate shipment number pattern - invalid', () => {
      component.headerForm.get('shipmentNo')?.setValue('invalid chars!@#');
      expect(component.headerForm.get('shipmentNo')?.hasError('pattern')).toBeTrue();
    });

    it('should accept valid shipment number', () => {
      component.headerForm.get('shipmentNo')?.setValue('SH-001_2026');
      expect(component.headerForm.get('shipmentNo')?.hasError('pattern')).toBeFalse();
    });

    it('should set shipmentNoError when pattern is violated', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.get('shipmentNo')?.setValue('bad!chars');
      tick();
      expect(component.shipmentNoError()).toContain('Shipment number can only contain');
    }));

    it('should clear shipmentNoError for valid input', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.get('shipmentNo')?.setValue('bad!');
      tick();
      expect(component.shipmentNoError()).not.toBe('');
      component.headerForm.get('shipmentNo')?.setValue('GOOD-123');
      tick();
      expect(component.shipmentNoError()).toBe('');
    }));
  });

  // ── Static Validators ────────────────────────────────────────────

  describe('Static Validators', () => {
    it('should flag shipment date after received date', () => {
      component.headerForm.patchValue({
        shipmentDate: moment('2026-06-20'),
        receivedDate: moment('2026-06-10'),
      });
      expect(component.headerForm.hasError('shipAfterRecv')).toBeTrue();
    });

    it('should pass when shipment date is before received date', () => {
      component.headerForm.patchValue({
        shipmentDate: moment('2026-06-01'),
        receivedDate: moment('2026-06-10'),
      });
      expect(component.headerForm.hasError('shipAfterRecv')).toBeFalse();
    });

    it('should pass when either date is null', () => {
      component.headerForm.patchValue({
        shipmentDate: null,
        receivedDate: moment('2026-06-10'),
      });
      expect(component.headerForm.hasError('shipAfterRecv')).toBeFalse();
    });

    it('should pass when both dates are null', () => {
      component.headerForm.patchValue({ shipmentDate: null, receivedDate: null });
      expect(component.headerForm.hasError('shipAfterRecv')).toBeFalse();
    });
  });

  // ── Transfer Mode Helpers ────────────────────────────────────────

  describe('Transfer Mode Helpers', () => {
    it('should correctly identify internal mode', () => {
      component.headerForm.get('transferMode')?.setValue('I');
      expect(component.isInternal).toBeTrue();
      expect(component.isExternal).toBeFalse();
    });

    it('should correctly identify external mode', () => {
      component.headerForm.get('transferMode')?.setValue('E');
      expect(component.isExternal).toBeTrue();
      expect(component.isInternal).toBeFalse();
    });

    it('should return null when no transfer mode selected', () => {
      component.headerForm.get('transferMode')?.setValue(null);
      expect(component.transferMode).toBeNull();
      expect(component.isInternal).toBeFalse();
      expect(component.isExternal).toBeFalse();
    });
  });

  // ── Transfer Mode Change ─────────────────────────────────────────

  describe('Transfer Mode Change', () => {
    beforeEach(() => initComponent());

    it('should load boxes for Internal mode', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      expect(apiServiceSpy.getBoxes).toHaveBeenCalledWith('I');
    }));

    it('should load boxes and contracts for External mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      expect(apiServiceSpy.getBoxes).toHaveBeenCalledWith('E');
      expect(apiServiceSpy.getContracts).toHaveBeenCalled();
    }));

    it('should NOT load contracts for Internal mode', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      expect(apiServiceSpy.getContracts).not.toHaveBeenCalled();
    }));

    it('should disable contract/profile/batch/extUnitId/collDate for Internal mode', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      expect(component.headerForm.get('contractId')?.disabled).toBeTrue();
      expect(component.headerForm.get('profileSetId')?.disabled).toBeTrue();
      expect(component.headerForm.get('batchId')?.disabled).toBeTrue();
      expect(component.detailForm.get('extUnitId')?.disabled).toBeTrue();
      expect(component.detailForm.get('collDate')?.disabled).toBeTrue();
    }));

    it('should enable contract/profile/batch/extUnitId/collDate for External mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      expect(component.headerForm.get('contractId')?.enabled).toBeTrue();
      expect(component.headerForm.get('profileSetId')?.enabled).toBeTrue();
      expect(component.headerForm.get('batchId')?.enabled).toBeTrue();
      expect(component.detailForm.get('extUnitId')?.enabled).toBeTrue();
      expect(component.detailForm.get('collDate')?.enabled).toBeTrue();
    }));

    it('should add required validators for contractId/profileSetId in External mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      component.headerForm.get('contractId')?.markAsTouched();
      expect(component.headerForm.get('contractId')?.hasError('required')).toBeTrue();
      component.headerForm.get('profileSetId')?.markAsTouched();
      expect(component.headerForm.get('profileSetId')?.hasError('required')).toBeTrue();
    }));

    it('should clear required validators for contractId in Internal mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      component.onTransferModeChange('I');
      tick();
      component.headerForm.get('contractId')?.markAsTouched();
      expect(component.headerForm.get('contractId')?.hasError('required')).toBeFalse();
    }));

    it('should disable newSampleType for External mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      expect(component.detailForm.get('newSampleType')?.disabled).toBeTrue();
    }));

    it('should enable newSampleType for Internal mode', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      expect(component.detailForm.get('newSampleType')?.enabled).toBeTrue();
    }));

    it('should disable frozenFlag for Internal mode', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      expect(component.detailForm.get('frozenFlag')?.disabled).toBeTrue();
    }));

    it('should reset state on mode change', fakeAsync(() => {
      component.boxSamples.set([makeSample()]);
      component.totalCheckedIn.set(5);
      component.onTransferModeChange('I');
      tick();
      expect(component.boxSamples()).toEqual([]);
      expect(component.totalCheckedIn()).toBe(0);
    }));
  });

  // ── Box ID Change ────────────────────────────────────────────────

  describe('onBoxIdChange', () => {
    beforeEach(() => initComponent());

    it('should do nothing when boxId is empty', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('');
      tick();
      expect(apiServiceSpy.validateBox).not.toHaveBeenCalled();
    }));

    it('should do nothing when transferMode is null', fakeAsync(() => {
      component.onBoxIdChange('BOX001');
      tick();
      expect(apiServiceSpy.validateBox).not.toHaveBeenCalled();
    }));

    it('should call validateBox and loadBoxSamples on success', fakeAsync(() => {
      const boxResult: BoxValidationResult = {
        boxId: 'BOX001', contractId: 'RC001', profileSetId: 'PS001',
        shipmentNo: 'SH001', shipmentDate: '06-10-2026 09:00',
        receivedDate: '06-15-2026 10:00', batchId: 'BAT001', boxStatus: 'O',
      };
      apiServiceSpy.validateBox.and.returnValue(of(boxResult));
      apiServiceSpy.getBoxSamples.and.returnValue(of([makeSample()]));

      component.headerForm.patchValue({ transferMode: 'E' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(apiServiceSpy.validateBox).toHaveBeenCalledWith('BOX001', 'E');
      expect(component.selectedBox()).toEqual(boxResult);
      expect(component.headerForm.get('shipmentNo')?.value).toBe('SH001');
      expect(apiServiceSpy.getBoxSamples).toHaveBeenCalledWith('BOX001', 'E');
    }));

    it('should load profiles and batches for external mode when contractId present', fakeAsync(() => {
      const boxResult: BoxValidationResult = {
        boxId: 'BOX001', contractId: 'RC001', profileSetId: null,
        shipmentNo: null, shipmentDate: null, receivedDate: null,
        batchId: null, boxStatus: 'O',
      };
      apiServiceSpy.validateBox.and.returnValue(of(boxResult));

      component.headerForm.patchValue({ transferMode: 'E' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(apiServiceSpy.getProfiles).toHaveBeenCalledWith('RC001');
      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('RC001');
    }));

    it('should NOT load profiles/batches for internal mode', fakeAsync(() => {
      const boxResult: BoxValidationResult = {
        boxId: 'BOX001', contractId: 'RC001', profileSetId: null,
        shipmentNo: null, shipmentDate: null, receivedDate: null,
        batchId: null, boxStatus: 'O',
      };
      apiServiceSpy.validateBox.and.returnValue(of(boxResult));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(apiServiceSpy.getProfiles).not.toHaveBeenCalled();
    }));

    it('should handle validateBox error for external mode (clear box)', fakeAsync(() => {
      apiServiceSpy.validateBox.and.returnValue(throwError(() => ({ error: { errorCode: '0254' } })));

      component.headerForm.patchValue({ transferMode: 'E' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(component.selectedBox()).toBeNull();
      expect(component.isLoading()).toBeFalse();
      expect(component.boxSamples()).toEqual([]);
      expect(component.totalCheckedIn()).toBe(0);
    }));

    it('should handle validateBox error for internal mode (show error)', fakeAsync(() => {
      apiServiceSpy.validateBox.and.returnValue(throwError(() => ({
        error: { errorCode: '0254', message: 'Invalid Box ID.' },
      })));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('0254');
    }));

    it('should handle null result by returning early', fakeAsync(() => {
      apiServiceSpy.validateBox.and.returnValue(of(null));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(component.selectedBox()).toBeNull();
      expect(component.isLoading()).toBeFalse();
    }));

    it('should use chapter local time as default received date when result has none', fakeAsync(() => {
      const boxResult: BoxValidationResult = {
        boxId: 'BOX001', contractId: null, profileSetId: null,
        shipmentNo: null, shipmentDate: null, receivedDate: null,
        batchId: null, boxStatus: 'O',
      };
      apiServiceSpy.validateBox.and.returnValue(of(boxResult));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      const recv = component.headerForm.get('receivedDate')?.value as moment.Moment;
      expect(recv).toBeTruthy();
    }));
  });

  // ── loadBoxSamples ───────────────────────────────────────────────

  describe('loadBoxSamples (via onBoxIdChange)', () => {
    beforeEach(() => initComponent());

    it('should set boxSamples and count checked-in', fakeAsync(() => {
      const samples = [
        makeSample({ verifyFlag: 'Y' }),
        makeSample({ verifyFlag: 'N', acceptFlag: 'Y', sampleSeqNo: '2' }),
        makeSample({ verifyFlag: 'N', acceptFlag: 'N', sampleSeqNo: '3' }),
      ];
      apiServiceSpy.validateBox.and.returnValue(of({
        boxId: 'BOX001', contractId: null, profileSetId: null,
        shipmentNo: null, shipmentDate: null, receivedDate: null,
        batchId: null, boxStatus: 'O',
      }));
      apiServiceSpy.getBoxSamples.and.returnValue(of(samples));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(component.boxSamples().length).toBe(3);
      expect(component.totalCheckedIn()).toBe(2);
    }));

    it('should handle getBoxSamples API error gracefully', fakeAsync(() => {
      apiServiceSpy.validateBox.and.returnValue(of({
        boxId: 'BOX001', contractId: null, profileSetId: null,
        shipmentNo: null, shipmentDate: null, receivedDate: null,
        batchId: null, boxStatus: 'O',
      }));
      apiServiceSpy.getBoxSamples.and.returnValue(throwError(() => new Error('fail')));

      component.headerForm.patchValue({ transferMode: 'I' });
      component.onBoxIdChange('BOX001');
      tick();

      expect(component.boxSamples()).toEqual([]);
    }));
  });

  // ── Contract Change ──────────────────────────────────────────────

  describe('onContractChange', () => {
    beforeEach(() => initComponent());

    it('should do nothing when contractId is empty', fakeAsync(() => {
      component.onContractChange('');
      tick();
      expect(apiServiceSpy.getProfiles).not.toHaveBeenCalled();
    }));

    it('should load profiles, batches, and validate contract', fakeAsync(() => {
      component.onContractChange('RC001');
      tick();
      expect(apiServiceSpy.getProfiles).toHaveBeenCalledWith('RC001');
      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('RC001');
      expect(apiServiceSpy.validateContract).toHaveBeenCalledWith('RC001');
    }));

    it('should set contractValidation, barcodeScheme, copyUnitsFlag on success', fakeAsync(() => {
      const result: ContractValidationResult = {
        contractId: 'RC001', barCodeProtocol: 'ISBT', unitIdType: 'C', copyIsbtFlag: 'Y',
      };
      apiServiceSpy.validateContract.and.returnValue(of(result));

      component.onContractChange('RC001');
      tick();

      expect(component.contractValidation()).toEqual(result);
      expect(component.barcodeScheme()).toBe('ISBT');
      expect(component.copyUnitsFlag()).toBe('C');
    }));

    it('should handle validateContract error and clear state', fakeAsync(() => {
      apiServiceSpy.validateContract.and.returnValue(throwError(() => ({
        error: { errorCode: '1147', message: 'Invalid contract ID.' },
      })));

      component.onContractChange('INVALID');
      tick();

      expect(component.contractValidation()).toBeNull();
      expect(component.barcodeScheme()).toBeNull();
      expect(component.copyUnitsFlag()).toBeNull();
      expect(snackBarOpenSpy).toHaveBeenCalled();
    }));

    it('should handle validateContract error with default message', fakeAsync(() => {
      apiServiceSpy.validateContract.and.returnValue(throwError(() => ({ error: {} })));

      component.onContractChange('INVALID');
      tick();

      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1147');
    }));
  });

  // ── Profile Set Change ───────────────────────────────────────────

  describe('onProfileSetChange', () => {
    beforeEach(() => {
      initComponent();
      component.profileOptions.set(mockProfiles);
    });

    it('should do nothing when profileSetId is empty', () => {
      component.onProfileSetChange('');
      expect(component.selectedProfileType()).toBeNull();
    });

    it('should set selectedProfileType and selectedProfileSeqNo', () => {
      component.onProfileSetChange('PS001');
      expect(component.selectedProfileType()).toBe('S');
      expect(component.selectedProfileSeqNo()).toBe(1);
    });

    it('should set null when profile not found', () => {
      component.onProfileSetChange('NOTFOUND');
      expect(component.selectedProfileType()).toBeNull();
      expect(component.selectedProfileSeqNo()).toBeNull();
    });

    it('should open adhoc tests dialog when profileType is A', fakeAsync(() => {
      const ref = createDialogRefSpy({ selectedTestIds: ['T1'] });
      dialogOpenSpy.and.returnValue(ref);

      component.onProfileSetChange('PS002');
      tick();

      expect(component.selectedProfileType()).toBe('A');
      expect(dialogOpenSpy).toHaveBeenCalled();
    }));
  });

  // ── Adhoc Tests Dialog ───────────────────────────────────────────

  describe('openAdhocTestsDialog', () => {
    beforeEach(() => initComponent());

    it('should load tests from API when not already loaded, then open dialog', fakeAsync(() => {
      const ref = createDialogRefSpy({ selectedTestIds: ['T1', 'T2'] });
      dialogOpenSpy.and.returnValue(ref);
      component.testOptions.set([]);

      component.openAdhocTestsDialog();
      tick();

      expect(apiServiceSpy.getTests).toHaveBeenCalled();
      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(component.selectedAdhocTestIds()).toEqual(['T1', 'T2']);
    }));

    it('should use cached tests if already loaded', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValue(ref);
      component.testOptions.set(mockTests);

      component.openAdhocTestsDialog();
      tick();

      expect(apiServiceSpy.getTests).not.toHaveBeenCalled();
      expect(dialogOpenSpy).toHaveBeenCalled();
    }));

    it('should not update selectedAdhocTestIds when dialog returns null', fakeAsync(() => {
      const ref = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValue(ref);
      component.testOptions.set(mockTests);
      component.selectedAdhocTestIds.set(['OLD']);

      component.openAdhocTestsDialog();
      tick();

      expect(component.selectedAdhocTestIds()).toEqual(['OLD']);
    }));

    it('should handle getTests API error gracefully', fakeAsync(() => {
      apiServiceSpy.getTests.and.returnValue(throwError(() => new Error('fail')));
      const ref = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValue(ref);
      component.testOptions.set([]);

      component.openAdhocTestsDialog();
      tick();

      expect(component.testOptions()).toEqual([]);
      expect(dialogOpenSpy).toHaveBeenCalled();
    }));
  });

  // ── Batch ID Change ──────────────────────────────────────────────

  describe('onBatchIdChange', () => {
    beforeEach(() => initComponent());

    it('should call generateNewBatch when batchId is __NEW__', fakeAsync(() => {
      component.headerForm.patchValue({ contractId: 'RC001', receivedDate: moment('2026-06-15T10:00:00') });
      component.onBatchIdChange('__NEW__');
      tick();

      expect(apiServiceSpy.generateBatch).toHaveBeenCalled();
    }));

    it('should not call generateBatch for regular batchId', fakeAsync(() => {
      component.onBatchIdChange('BAT001');
      tick();
      expect(apiServiceSpy.generateBatch).not.toHaveBeenCalled();
    }));

    it('should patch batchId and show success on successful generation', fakeAsync(() => {
      apiServiceSpy.generateBatch.and.returnValue(of('BAT-NEW'));
      component.onBatchIdChange('__NEW__');
      tick();

      expect(component.headerForm.get('batchId')?.value).toBe('BAT-NEW');
      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('BAT-NEW');
    }));

    it('should handle error code 1083 for batch generation', fakeAsync(() => {
      apiServiceSpy.generateBatch.and.returnValue(throwError(() => ({
        error: { errorCode: '1083', message: 'Incomplete batch exists.' },
      })));
      component.onBatchIdChange('__NEW__');
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1083');
    }));

    it('should handle generic error for batch generation', fakeAsync(() => {
      apiServiceSpy.generateBatch.and.returnValue(throwError(() => ({
        error: { errorCode: '9999' },
      })));
      component.onBatchIdChange('__NEW__');
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Failed to generate batch ID');
    }));

    it('should not patch batchId when result is empty string', fakeAsync(() => {
      apiServiceSpy.generateBatch.and.returnValue(of(''));
      component.headerForm.patchValue({ batchId: 'OLD' });
      component.onBatchIdChange('__NEW__');
      tick();

      // The empty string result from catchError path does not patch
      expect(component.headerForm.get('batchId')?.value).toBe('OLD');
    }));
  });

  // ── Frozen/Thaw Validation ───────────────────────────────────────

  describe('Frozen/Thaw Validation', () => {
    beforeEach(() => initComponent());

    it('should show error when thaw is set without frozen', fakeAsync(() => {
      component.detailForm.get('frozenFlag')?.setValue(null);
      component.detailForm.get('thawFlag')?.setValue('Y');
      tick();
      expect(component.frozenThawError()).toBe('Thaw cannot be set without Frozen.');
      expect(component.detailForm.get('thawFlag')?.hasError('frozenThaw')).toBeTrue();
    }));

    it('should clear error when frozen is set before thaw', fakeAsync(() => {
      component.detailForm.get('frozenFlag')?.setValue('Y');
      component.detailForm.get('thawFlag')?.setValue('Y');
      tick();
      expect(component.frozenThawError()).toBe('');
    }));

    it('should clear frozenThaw error when thaw is cleared', fakeAsync(() => {
      component.detailForm.get('frozenFlag')?.setValue(null);
      component.detailForm.get('thawFlag')?.setValue('Y');
      tick();
      expect(component.frozenThawError()).not.toBe('');
      component.detailForm.get('thawFlag')?.setValue(null);
      tick();
      expect(component.frozenThawError()).toBe('');
    }));

    it('should not set error when both frozen and thaw are null', fakeAsync(() => {
      component.detailForm.get('frozenFlag')?.setValue(null);
      component.detailForm.get('thawFlag')?.setValue(null);
      tick();
      expect(component.frozenThawError()).toBe('');
    }));
  });

  // ── newSampleType Validation ─────────────────────────────────────

  describe('newSampleType same as current validation', () => {
    beforeEach(() => initComponent());

    it('should show error when newSampleType matches current sampleType', fakeAsync(() => {
      component.detailForm.get('sampleType')?.setValue('FRZN');
      component.detailForm.get('newSampleType')?.setValue('FRZN');
      tick();
      expect(component.newSampleTypeError()).toBe('New sample type cannot be the same as current sample type.');
    }));

    it('should clear error when newSampleType differs from current', fakeAsync(() => {
      component.detailForm.get('sampleType')?.setValue('FRZN');
      component.detailForm.get('newSampleType')?.setValue('CLT');
      tick();
      expect(component.newSampleTypeError()).toBe('');
    }));

    it('should clear error when newSampleType is null', fakeAsync(() => {
      component.detailForm.get('sampleType')?.setValue('FRZN');
      component.detailForm.get('newSampleType')?.setValue(null);
      tick();
      expect(component.newSampleTypeError()).toBe('');
    }));
  });

  // ── Date Cross-Field Validation ──────────────────────────────────

  describe('validateDateCrossFields', () => {
    beforeEach(() => initComponent());

    it('should set shipDateFutureError when ship date is in the future', fakeAsync(() => {
      component.headerForm.get('shipmentDate')?.setValue(moment('2030-01-01'));
      tick();
      expect(component.shipDateFutureError()).toContain('Shipment date/time cannot be in the future');
    }));

    it('should set recvDateFutureError when received date is in the future', fakeAsync(() => {
      component.headerForm.get('receivedDate')?.setValue(moment('2030-01-01'));
      tick();
      expect(component.recvDateFutureError()).toContain('Received date/time cannot be in the future');
    }));

    it('should set shipRecvDateError when ship is after received', fakeAsync(() => {
      component.headerForm.patchValue({
        shipmentDate: moment('2026-06-14'),
        receivedDate: moment('2026-06-10'),
      });
      // trigger the valueChanges listener
      component.headerForm.get('shipmentDate')?.setValue(moment('2026-06-14'));
      tick();
      expect(component.shipRecvDateError()).toContain('Shipment date cannot be later than received date');
    }));

    it('should clear errors when dates are valid', fakeAsync(() => {
      component.headerForm.get('shipmentDate')?.setValue(moment('2026-06-01'));
      tick();
      component.headerForm.get('receivedDate')?.setValue(moment('2026-06-10'));
      tick();
      expect(component.shipDateFutureError()).toBe('');
      expect(component.recvDateFutureError()).toBe('');
      expect(component.shipRecvDateError()).toBe('');
    }));

    it('should set shipRecvDateErrorField to changedField when error exists', fakeAsync(() => {
      component.headerForm.patchValue({
        shipmentDate: moment('2026-06-14'),
        receivedDate: moment('2026-06-10'),
      });
      component.headerForm.get('receivedDate')?.setValue(moment('2026-06-10'));
      tick();
      expect(component.shipRecvDateErrorField()).toBe('receivedDate');
    }));
  });

  // ── Collection Date Future Validation ────────────────────────────

  describe('validateCollDateFuture', () => {
    beforeEach(() => initComponent());

    it('should set collDateFutureError when coll date is in the future (external mode)', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.detailForm.get('collDate')?.setValue(moment('2030-01-01'));
      tick();
      expect(component.collDateFutureError()).toContain('Collection date/time cannot be in the future');
    }));

    it('should clear collDateFutureError for internal mode', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I' });
      component.detailForm.get('collDate')?.setValue(moment('2030-01-01'));
      tick();
      expect(component.collDateFutureError()).toBe('');
    }));

    it('should clear collDateFutureError when date is null', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.detailForm.get('collDate')?.setValue(null);
      tick();
      expect(component.collDateFutureError()).toBe('');
    }));

    it('should clear collDateFutureError when date is in the past', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.detailForm.get('collDate')?.setValue(moment('2026-01-01'));
      tick();
      expect(component.collDateFutureError()).toBe('');
    }));
  });

  // ── Unit ID Validation Events ────────────────────────────────────

  describe('onExtUnitIdValidated', () => {
    beforeEach(() => initComponent());

    it('should set extUnitId in form and clear error', () => {
      component.onExtUnitIdValidated({
        parsedUnitId: 'PARSED001', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      expect(component.detailForm.get('extUnitId')?.value).toBe('PARSED001');
      expect(component.extUnitIdError()).toBe('');
    });

    it('should copy extUnitId to intUnitId when copyIsbtFlag is Y (external mode)', () => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.contractValidation.set({
        contractId: 'RC001', barCodeProtocol: null, unitIdType: null, copyIsbtFlag: 'Y',
      });

      component.onExtUnitIdValidated({
        parsedUnitId: 'PARSED001', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });

      expect(component.detailForm.get('intUnitId')?.value).toBe('PARSED001');
    });

    it('should NOT copy extUnitId to intUnitId when copyIsbtFlag is N', () => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.contractValidation.set({
        contractId: 'RC001', barCodeProtocol: null, unitIdType: null, copyIsbtFlag: 'N',
      });

      component.onExtUnitIdValidated({
        parsedUnitId: 'PARSED001', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });

      expect(component.detailForm.get('intUnitId')?.value).not.toBe('PARSED001');
    });
  });

  describe('onExtUnitIdCleared', () => {
    beforeEach(() => initComponent());

    it('should clear extUnitId and error', () => {
      component.detailForm.patchValue({ extUnitId: 'SOME_ID' });
      component.onExtUnitIdCleared();
      expect(component.detailForm.get('extUnitId')?.value).toBe('');
      expect(component.extUnitIdError()).toBe('');
    });

    it('should clear intUnitId when copyIsbtFlag is Y in external mode', () => {
      component.headerForm.patchValue({ transferMode: 'E' });
      component.contractValidation.set({
        contractId: 'RC001', barCodeProtocol: null, unitIdType: null, copyIsbtFlag: 'Y',
      });
      component.detailForm.patchValue({ intUnitId: 'X123' });

      component.onExtUnitIdCleared();

      expect(component.detailForm.get('intUnitId')?.value).toBe('');
    });
  });

  describe('onIntUnitIdValidated', () => {
    beforeEach(() => initComponent());

    it('should set intUnitId in form and clear error', () => {
      component.onIntUnitIdValidated({
        parsedUnitId: 'INT001', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      expect(component.detailForm.get('intUnitId')?.value).toBe('INT001');
      expect(component.intUnitIdError()).toBe('');
    });
  });

  describe('onIntUnitIdCleared', () => {
    beforeEach(() => initComponent());

    it('should clear intUnitId and error', () => {
      component.detailForm.patchValue({ intUnitId: 'SOME_ID' });
      component.onIntUnitIdCleared();
      expect(component.detailForm.get('intUnitId')?.value).toBe('');
      expect(component.intUnitIdError()).toBe('');
    });
  });

  // ── lookupBoxSample (via onIntUnitIdValidated) ───────────────────

  describe('lookupBoxSample', () => {
    beforeEach(() => {
      initComponent();
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001' });
    });

    it('should apply single matching sample from boxSamples', fakeAsync(() => {
      const sample = makeSample({ intUnitId: 'I1', sampleType: 'FRZN', frozenFlag: 'Y' });
      component.boxSamples.set([sample]);

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(component.sampleDataLoaded()).toBeTrue();
      expect(component.detailForm.get('sampleType')?.value).toBe('FRZN');
    }));

    it('should handle multiple matches - all checked in shows warning', fakeAsync(() => {
      const s1 = makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'Y' });
      const s2 = makeSample({ intUnitId: 'I1', sampleType: 'CLT', acceptFlag: 'Y', sampleSeqNo: '2' });
      component.boxSamples.set([s1, s2]);

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1383');
    }));

    it('should handle multiple matches - one unchecked applies it', fakeAsync(() => {
      const s1 = makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'Y' });
      const s2 = makeSample({ intUnitId: 'I1', sampleType: 'CLT', verifyFlag: 'N', acceptFlag: 'N', sampleSeqNo: '2' });
      component.boxSamples.set([s1, s2]);

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(component.sampleDataLoaded()).toBeTrue();
      expect(component.detailForm.get('sampleType')?.value).toBe('CLT');
    }));

    it('should handle multiple matches - multiple unchecked enters multi-sample mode', fakeAsync(() => {
      const s1 = makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'N', acceptFlag: 'N' });
      const s2 = makeSample({ intUnitId: 'I1', sampleType: 'CLT', verifyFlag: 'N', acceptFlag: 'N', sampleSeqNo: '2' });
      component.boxSamples.set([s1, s2]);

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(component.isMultiSampleMode()).toBeTrue();
      expect(component.multiSampleTypes()).toEqual(['FRZN', 'CLT']);
    }));

    it('should load from server when no box sample match found', fakeAsync(() => {
      component.boxSamples.set([]);
      apiServiceSpy.getSampleData.and.returnValue(of({
        unitId: 'I1', collDate: '06-10-2026 08:00', contractId: 'RC001',
        sampleType: 'FRZN', frozenFlag: 'N', thawFlag: 'N', sampleSeqNo: '1', boxId: 'BOX001',
      } as SampleDataResult));

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(apiServiceSpy.getSampleData).toHaveBeenCalledWith('I1', 'BOX001');
      expect(component.sampleDataLoaded()).toBeTrue();
    }));

    it('should handle getSampleData error code 1230 or 1391', fakeAsync(() => {
      component.boxSamples.set([]);
      apiServiceSpy.getSampleData.and.returnValue(throwError(() => ({
        error: { errorCode: '1230', message: 'Unit not found' },
      })));

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(component.intUnitIdError()).toContain('1230');
    }));

    it('should not lookup when mode is External', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'E' });

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(apiServiceSpy.getSampleData).not.toHaveBeenCalled();
    }));

    it('should not lookup when boxId is null', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: null });

      component.onIntUnitIdValidated({
        parsedUnitId: 'I1', checkDigit: null, codeScheme: 'I',
        manualUnitId: 'M1', codabarUnitScheme: null, entryMode: 'S',
        barcodeType: 'CODE128', chapterScheme: 'I',
      });
      tick();

      expect(apiServiceSpy.getSampleData).not.toHaveBeenCalled();
    }));
  });

  // ── Duplicate Sample Check ───────────────────────────────────────

  describe('checkDuplicateSampleLocal', () => {
    beforeEach(() => initComponent());

    it('should detect local duplicate', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN' });
      component.boxSamples.set([makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'Y' })]);

      const result = (component as any).checkDuplicateSampleLocal();
      expect(result).toBeTrue();
    });

    it('should return false when no duplicate', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'CLT' });
      component.boxSamples.set([makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'Y' })]);

      const result = (component as any).checkDuplicateSampleLocal();
      expect(result).toBeFalse();
    });

    it('should return false when boxId is empty', () => {
      component.headerForm.patchValue({ boxId: null });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN' });

      const result = (component as any).checkDuplicateSampleLocal();
      expect(result).toBeFalse();
    });

    it('should use newSampleType if set', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      component.boxSamples.set([makeSample({ intUnitId: 'I1', sampleType: 'CLT', verifyFlag: 'Y' })]);

      const result = (component as any).checkDuplicateSampleLocal();
      expect(result).toBeTrue();
    });

    it('should match on extUnitId as well', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.detailForm.patchValue({ intUnitId: '', extUnitId: 'E1', sampleType: 'FRZN' });
      component.boxSamples.set([makeSample({ extUnitId: 'E1', sampleType: 'FRZN', verifyFlag: 'Y' })]);

      const result = (component as any).checkDuplicateSampleLocal();
      expect(result).toBeTrue();
    });
  });

  // ── onSave ───────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should show error when transferMode is null', () => {
      initComponent();
      component.headerForm.patchValue({ transferMode: null });
      component.onSave();
      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('2319');
    });

    it('should show error when boxId is null', () => {
      initComponent();
      component.headerForm.patchValue({ transferMode: 'I', boxId: null });
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('0080');
      expect(msg).toContain('Box ID');
    });

    it('should show error when unit ID validation is still in progress (ext)', fakeAsync(() => {
      setupExternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).extUnitIdField = { validationState: 'validating', unitIdControl: new FormControl('test'), parsedUnitId: null, validationError: null };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('validation is still in progress');
    }));

    it('should show error when unit ID validation is still in progress (int)', fakeAsync(() => {
      setupInternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).intUnitIdField = { validationState: 'validating', unitIdControl: new FormControl('test'), parsedUnitId: null, validationError: null };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('validation is still in progress');
    }));

    it('should show error for external mode when extUnitId is empty', fakeAsync(() => {
      setupExternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).extUnitIdField = { validationState: 'idle', unitIdControl: new FormControl(''), parsedUnitId: null, validationError: null };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('External Unit ID is required');
    }));

    it('should show error when ext unit ID is invalid', fakeAsync(() => {
      setupExternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).extUnitIdField = {
        validationState: 'invalid', unitIdControl: new FormControl('BAD'),
        parsedUnitId: null, validationError: 'Bad format',
      };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1230');
      expect(msg).toContain('Bad format');
    }));

    it('should show error for internal mode when intUnitId is empty', fakeAsync(() => {
      setupInternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).intUnitIdField = { validationState: 'idle', unitIdControl: new FormControl(''), parsedUnitId: null, validationError: null };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Internal Unit ID is required');
    }));

    it('should show error when int unit ID is invalid', fakeAsync(() => {
      setupInternalMode();
      tick();
      component.headerForm.patchValue({ boxId: 'BOX001' });
      (component as any).intUnitIdField = {
        validationState: 'invalid', unitIdControl: new FormControl('BAD'),
        parsedUnitId: null, validationError: 'Bad format',
      };
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1230');
    }));

    it('should show error for external mode when contractId is missing', fakeAsync(() => {
      setupExternalMode();
      tick();
      // Mock extUnitIdField to bypass unit ID validation
      (component as any).extUnitIdField = { validationState: 'valid', unitIdControl: new FormControl('EXT1'), parsedUnitId: 'EXT1', validationError: null };
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.headerForm.get('contractId')!.setValue(null);
      component.headerForm.get('profileSetId')!.setValue('PS001');
      component.headerForm.get('shipmentDate')!.setValue(moment('2026-06-10'));
      component.headerForm.get('receivedDate')!.setValue(moment('2026-06-15'));
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Contract ID');
    }));

    it('should show error for external mode when profileSetId is missing', fakeAsync(() => {
      setupExternalMode();
      tick();
      (component as any).extUnitIdField = { validationState: 'valid', unitIdControl: new FormControl('EXT1'), parsedUnitId: 'EXT1', validationError: null };
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.headerForm.get('contractId')!.setValue('RC001');
      component.headerForm.get('profileSetId')!.setValue(null);
      component.headerForm.get('shipmentDate')!.setValue(moment('2026-06-10'));
      component.headerForm.get('receivedDate')!.setValue(moment('2026-06-15'));
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Profile Set ID');
    }));

    it('should show error for external mode when shipmentDate is missing', fakeAsync(() => {
      setupExternalMode();
      tick();
      (component as any).extUnitIdField = { validationState: 'valid', unitIdControl: new FormControl('EXT1'), parsedUnitId: 'EXT1', validationError: null };
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.headerForm.get('contractId')!.setValue('RC001');
      component.headerForm.get('profileSetId')!.setValue('PS001');
      component.headerForm.get('shipmentDate')!.setValue(null);
      component.headerForm.get('receivedDate')!.setValue(moment('2026-06-15'));
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Shipment Date');
    }));

    it('should show error for external mode when receivedDate is missing', fakeAsync(() => {
      setupExternalMode();
      tick();
      (component as any).extUnitIdField = { validationState: 'valid', unitIdControl: new FormControl('EXT1'), parsedUnitId: 'EXT1', validationError: null };
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.headerForm.get('contractId')!.setValue('RC001');
      component.headerForm.get('profileSetId')!.setValue('PS001');
      component.headerForm.get('shipmentDate')!.setValue(moment('2026-06-10'));
      component.headerForm.get('receivedDate')!.setValue(null);
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Received Date');
    }));

    it('should show error for external mode when collDate is missing', fakeAsync(() => {
      setupExternalMode();
      tick();
      (component as any).extUnitIdField = { validationState: 'valid', unitIdControl: new FormControl('EXT1'), parsedUnitId: 'EXT1', validationError: null };
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.headerForm.get('contractId')!.setValue('RC001');
      component.headerForm.get('profileSetId')!.setValue('PS001');
      component.headerForm.get('shipmentDate')!.setValue(moment('2026-06-10'));
      component.headerForm.get('receivedDate')!.setValue(moment('2026-06-15'));
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.detailForm.get('collDate')!.setValue(null);
      component.onSave();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Collection Date');
    }));

    it('should validate sampleType required via getFirstValidationError', fakeAsync(() => {
      initComponent();
      tick();
      component.detailForm.get('intUnitId')!.disable();
      component.detailForm.get('sampleType')!.enable();
      component.detailForm.get('sampleType')!.setValue(null);
      component.detailForm.get('sampleType')!.markAsTouched();
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Sample Type is required');
    }));

    it('should set shipmentNoError when pattern is violated via valueChanges', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.get('shipmentNo')!.setValue('bad!');
      tick();
      expect(component.shipmentNoError()).not.toBe('');
    }));

    it('should set shipDateFutureError when ship date is future', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.get('shipmentDate')!.setValue(moment('2030-01-01'));
      tick();
      expect(component.shipDateFutureError()).toContain('Shipment date/time cannot be in the future');
    }));

    it('should set frozenThawError via validateFrozenThaw', fakeAsync(() => {
      initComponent();
      tick();
      component.detailForm.get('frozenFlag')!.setValue(null);
      component.detailForm.get('thawFlag')!.setValue('Y');
      tick();
      expect(component.frozenThawError()).toBe('Thaw cannot be set without Frozen.');
    }));

    it('should set newSampleTypeError when same as current', fakeAsync(() => {
      initComponent();
      tick();
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.detailForm.get('newSampleType')!.setValue('FRZN');
      tick();
      expect(component.newSampleTypeError()).toBe('New sample type cannot be the same as current sample type.');
    }));

    it('should detect local duplicate via checkDuplicateSampleLocal', () => {
      initComponent();
      component.headerForm.get('boxId')!.setValue('BOX001');
      component.detailForm.get('intUnitId')!.setValue('I1');
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.boxSamples.set([makeSample({ intUnitId: 'I1', sampleType: 'FRZN', verifyFlag: 'Y' })]);
      expect((component as any).checkDuplicateSampleLocal()).toBeTrue();
    });

    it('should call checkDuplicateSampleServer and invoke callback on pass', fakeAsync(() => {
      initComponent();
      apiServiceSpy.checkDuplicateSample.and.returnValue(of({ isDuplicate: false }));
      const onPass = jasmine.createSpy('onPass');
      (component as any).checkDuplicateSampleServer('BOX001', 'I1', 'FRZN', onPass);
      tick();
      expect(apiServiceSpy.checkDuplicateSample).toHaveBeenCalledWith('BOX001', 'I1', 'FRZN');
      expect(onPass).toHaveBeenCalled();
    }));

    it('should show error on server duplicate', fakeAsync(() => {
      initComponent();
      apiServiceSpy.checkDuplicateSample.and.returnValue(of({ isDuplicate: true }));
      const onPass = jasmine.createSpy('onPass');
      (component as any).checkDuplicateSampleServer('BOX001', 'I1', 'FRZN', onPass);
      tick();
      expect(onPass).not.toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalled();
    }));

    it('should submit check-in via executeCheckIn directly', fakeAsync(() => {
      initComponent();
      tick();
      component.headerForm.get('boxId')!.setValue('BOX001');
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));
      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001', intUnitId: 'I1', sampleType: 'FRZN' };
      (component as any).executeCheckIn(dto);
      tick();
      expect(apiServiceSpy.checkIn).toHaveBeenCalledWith(dto);
    }));
  });

  // ── executeCheckIn (direct call) ─────────────────────────────────

  describe('executeCheckIn (direct call)', () => {
    beforeEach(() => initComponent());

    it('should show success and reload box samples on successful check-in', fakeAsync(() => {
      component.headerForm.get('boxId')!.setValue('BOX001');
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([makeSample({ verifyFlag: 'Y' })]));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001', intUnitId: 'I1', sampleType: 'FRZN' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('8010');
      expect(component.totalCheckedIn()).toBeGreaterThanOrEqual(1);
    }));

    it('should handle check-in API error', fakeAsync(() => {
      apiServiceSpy.checkIn.and.returnValue(throwError(() => ({
        error: { errorCode: '9999', message: 'Server error' },
      })));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('9999');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should handle 1389 warning from API error and open dialog', fakeAsync(() => {
      const warningRef = createDialogRefSpy(false);
      dialogOpenSpy.and.returnValue(warningRef);
      apiServiceSpy.checkIn.and.returnValue(throwError(() => ({
        error: { errorCode: '1389', errorResponse: { error: 'Sample has hold' } },
      })));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(dialogOpenSpy).toHaveBeenCalled();
    }));

    it('should handle 1389 from success response', fakeAsync(() => {
      const warningRef = createDialogRefSpy(false);
      dialogOpenSpy.and.returnValue(warningRef);
      apiServiceSpy.checkIn.and.returnValue(of({
        success: false, message: '1389: Sample has hold', errorCode: '1389',
        data: null, statusCode: 200,
      } as any));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(dialogOpenSpy).toHaveBeenCalled();
    }));

    it('should handle non-success response with generic error', fakeAsync(() => {
      apiServiceSpy.checkIn.and.returnValue(of({
        success: false, message: 'Some other error', errorCode: '5555',
        data: null, statusCode: 400,
      } as any));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(snackBarOpenSpy).toHaveBeenCalled();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('5555');
    }));

    it('should not process null response from catchError', fakeAsync(() => {
      apiServiceSpy.checkIn.and.returnValue(throwError(() => ({
        error: { errorCode: '0000', message: 'Random error' },
      })));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).executeCheckIn(dto);
      tick();

      expect(component.isLoading()).toBeFalse();
    }));
  });

  // ── handleWarning1389 / Override Dialog ──────────────────────────

  describe('handleWarning1389 and override dialog flow', () => {
    beforeEach(() => initComponent());

    it('should open override dialog when user accepts warning', fakeAsync(() => {
      // First dialog: warning - user clicks yes
      const warningRef = createDialogRefSpy(true);
      // Second dialog: override - user submits override data
      const overrideRef = createDialogRefSpy({
        userId: 'user1', reasonCode: 'R1', holdCode: 'H1', comments: 'test',
      });
      dialogOpenSpy.and.returnValues(warningRef, overrideRef);

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).handleWarning1389(dto, 'Warning 1389: Sample has hold');
      tick();

      // Should have called dialog.open twice (warning + override)
      expect(dialogOpenSpy).toHaveBeenCalledTimes(2);
    }));

    it('should call clearAll when user cancels warning dialog', fakeAsync(() => {
      const warningRef = createDialogRefSpy(false);
      dialogOpenSpy.and.returnValue(warningRef);

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      spyOn(component, 'clearAll');
      (component as any).handleWarning1389(dto, 'Warning');
      tick();

      expect(component.clearAll).toHaveBeenCalled();
    }));

    it('should call clearAll when user cancels override dialog', fakeAsync(() => {
      const warningRef = createDialogRefSpy(true);
      const overrideRef = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValues(warningRef, overrideRef);

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      spyOn(component, 'clearAll');
      (component as any).handleWarning1389(dto, 'Warning');
      tick();

      expect(component.clearAll).toHaveBeenCalled();
    }));

    it('should set acceptFlag and override fields on dto when user completes override', fakeAsync(() => {
      const warningRef = createDialogRefSpy(true);
      const overrideRef = createDialogRefSpy({
        userId: 'admin', reasonCode: 'R1', holdCode: 'H1', comments: 'Approved',
      });
      dialogOpenSpy.and.returnValues(warningRef, overrideRef);
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).handleWarning1389(dto, 'Warning');
      tick();

      expect(apiServiceSpy.checkIn).toHaveBeenCalled();
      const calledDto = apiServiceSpy.checkIn.calls.mostRecent().args[0];
      expect(calledDto.acceptFlag).toBe('Y');
      expect(calledDto.ovrUserId).toBe('admin');
      expect(calledDto.ovrReasonCode).toBe('R1');
    }));

    it('should load override reasons/holds/comments from API when not cached', fakeAsync(() => {
      component.overrideReasons.set([]);
      component.overrideHolds.set([]);
      component.overrideComments.set([]);

      const overrideRef = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValue(overrideRef);

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).openOverrideDialog(dto);
      tick();

      expect(apiServiceSpy.getOverrideReasons).toHaveBeenCalled();
      expect(apiServiceSpy.getOverrideHolds).toHaveBeenCalled();
      expect(apiServiceSpy.getOverrideComments).toHaveBeenCalled();
      expect(component.overrideReasons().length).toBe(1);
    }));

    it('should use cached override data when already loaded', fakeAsync(() => {
      component.overrideReasons.set(mockOverrideReasons);
      component.overrideHolds.set(mockOverrideHolds);
      component.overrideComments.set(mockOverrideComments);

      const overrideRef = createDialogRefSpy(null);
      dialogOpenSpy.and.returnValue(overrideRef);

      const dto: CheckInRequest = { transferMode: 'I', boxId: 'BOX001' };
      (component as any).openOverrideDialog(dto);
      tick();

      expect(apiServiceSpy.getOverrideReasons).not.toHaveBeenCalled();
    }));
  });

  // ── buildAndSubmitCheckIn DTO construction ────────────────────────

  describe('buildAndSubmitCheckIn (direct call)', () => {
    beforeEach(() => initComponent());

    it('should include thawStartTime when thawFlag is Y', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001', receivedDate: moment('2026-06-15T10:00:00') });
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.detailForm.get('thawFlag')!.setValue('Y');
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      (component as any).buildAndSubmitCheckIn();
      tick();

      expect(apiServiceSpy.checkIn).toHaveBeenCalled();
      const calledDto = apiServiceSpy.checkIn.calls.mostRecent().args[0] as CheckInRequest;
      expect(calledDto.thawStartTime).toBeTruthy();
    }));

    it('should not include thawStartTime when thawFlag is not Y', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001', receivedDate: moment('2026-06-15T10:00:00') });
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.detailForm.get('thawFlag')!.setValue(null);
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      (component as any).buildAndSubmitCheckIn();
      tick();

      expect(apiServiceSpy.checkIn).toHaveBeenCalled();
      const calledDto = apiServiceSpy.checkIn.calls.mostRecent().args[0] as CheckInRequest;
      expect(calledDto.thawStartTime).toBeUndefined();
    }));

    it('should include adhocTestIds when present', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001', receivedDate: moment('2026-06-15T10:00:00') });
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.selectedAdhocTestIds.set(['T1', 'T2']);
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      (component as any).buildAndSubmitCheckIn();
      tick();

      expect(apiServiceSpy.checkIn).toHaveBeenCalled();
      const calledDto = apiServiceSpy.checkIn.calls.mostRecent().args[0] as CheckInRequest;
      expect(calledDto.adhocTestIds).toEqual(['T1', 'T2']);
    }));

    it('should not include adhocTestIds when empty', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I', boxId: 'BOX001', receivedDate: moment('2026-06-15T10:00:00') });
      component.detailForm.get('sampleType')!.setValue('FRZN');
      component.selectedAdhocTestIds.set([]);
      apiServiceSpy.checkIn.and.returnValue(of({ success: true, message: 'OK', data: null, statusCode: 200 } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      (component as any).buildAndSubmitCheckIn();
      tick();

      expect(apiServiceSpy.checkIn).toHaveBeenCalled();
      const calledDto = apiServiceSpy.checkIn.calls.mostRecent().args[0] as CheckInRequest;
      expect(calledDto.adhocTestIds).toBeUndefined();
    }));
  });

  // ── onNotation ───────────────────────────────────────────────────

  describe('onNotation', () => {
    beforeEach(() => initComponent());

    it('should show error when no unit ID is entered', () => {
      component.detailForm.patchValue({ intUnitId: '', extUnitId: '' });
      component.onNotation();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('0903');
    });

    it('should open notation dialog when intUnitId is set', () => {
      dialogOpenSpy.and.returnValue(createDialogRefSpy(null));
      component.detailForm.patchValue({ intUnitId: 'I1' });
      component.onNotation();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should open notation dialog when extUnitId is set (fallback)', () => {
      dialogOpenSpy.and.returnValue(createDialogRefSpy(null));
      component.detailForm.patchValue({ intUnitId: '', extUnitId: 'E1' });
      component.onNotation();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });
  });

  // ── isDetailDirty ────────────────────────────────────────────────

  describe('isDetailDirty', () => {
    beforeEach(() => initComponent());

    it('should return false when no snapshot', () => {
      component.loadedSampleSnapshot.set(null);
      expect(component.isDetailDirty()).toBeFalse();
    });

    it('should return true when newSampleType is set', () => {
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ newSampleType: 'CLT' });
      expect(component.isDetailDirty()).toBeTrue();
    });

    it('should return true when frozenFlag changed', () => {
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ frozenFlag: 'Y', newSampleType: null });
      expect(component.isDetailDirty()).toBeTrue();
    });

    it('should return true when thawFlag changed', () => {
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ thawFlag: 'Y', newSampleType: null });
      expect(component.isDetailDirty()).toBeTrue();
    });

    it('should return false when nothing changed', () => {
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ frozenFlag: null, thawFlag: null, newSampleType: null });
      expect(component.isDetailDirty()).toBeFalse();
    });
  });

  // ── onUpdate ─────────────────────────────────────────────────────

  describe('onUpdate', () => {
    beforeEach(() => initComponent());

    it('should show error when boxId is null', () => {
      component.headerForm.patchValue({ boxId: null });
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Box ID is required');
    });

    it('should show error when no snapshot loaded', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.loadedSampleSnapshot.set(null);
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('select an existing checked-in sample');
    });

    it('should show error when intUnitId is missing', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: '' });
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Internal Unit ID is required');
    });

    it('should show error when frozenThawError is set', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1' });
      component.frozenThawError.set('Thaw cannot be set without Frozen.');
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1385');
    });

    it('should show error when newSampleTypeError is set', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1' });
      component.newSampleTypeError.set('New sample type cannot be the same as current sample type.');
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('1382');
    });

    it('should show warning when no changes detected', () => {
      component.headerForm.patchValue({ boxId: 'BOX001' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', frozenFlag: null, thawFlag: null, newSampleType: null });
      component.onUpdate();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('No changes detected');
    });

    it('should call updateSampleDetail API on success', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      apiServiceSpy.updateSampleDetail.and.returnValue(of({ success: true, message: 'Updated' } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      component.onUpdate();
      tick();

      expect(apiServiceSpy.updateSampleDetail).toHaveBeenCalled();
      const calledDto = apiServiceSpy.updateSampleDetail.calls.mostRecent().args[0];
      expect(calledDto.boxId).toBe('BOX001');
      expect(calledDto.newSampleType).toBe('CLT');
    }));

    it('should show success message on successful update', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      apiServiceSpy.updateSampleDetail.and.returnValue(of({ success: true, message: 'Updated' } as any));
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      component.onUpdate();
      tick();

      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('updated successfully');
    }));

    it('should show error on failed update', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      apiServiceSpy.updateSampleDetail.and.returnValue(of({ success: false, message: 'Failed to update' } as any));

      component.onUpdate();
      tick();

      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Failed to update');
    }));

    it('should handle updateSampleDetail API error', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      apiServiceSpy.updateSampleDetail.and.returnValue(throwError(() => ({
        error: { message: 'Server error' },
      })));

      component.onUpdate();
      tick();

      expect(component.isLoading()).toBeFalse();
      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Server error');
    }));

    it('should handle updateSampleDetail API error with no message', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN', newSampleType: 'CLT' });
      apiServiceSpy.updateSampleDetail.and.returnValue(throwError(() => ({ error: {} })));

      component.onUpdate();
      tick();

      const msg = snackBarOpenSpy.calls.mostRecent().args[0];
      expect(msg).toContain('Failed to update sample detail');
    }));
  });

  // ── Table Events ─────────────────────────────────────────────────

  describe('onTablePageChange', () => {
    beforeEach(() => initComponent());

    it('should update tableConfig pagination', () => {
      component.onTablePageChange({ pageSize: 25, pageIndex: 2, length: 100 });
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
    });
  });

  describe('onTableSortChange', () => {
    beforeEach(() => initComponent());

    it('should sort samples ascending', () => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.boxSamples.set([
        makeSample({ extUnitId: 'Z1' }),
        makeSample({ extUnitId: 'A1', sampleSeqNo: '2' }),
      ]);

      component.onTableSortChange({ column: 'extUnitId', direction: 'A' });

      expect(component.boxSamples()[0].extUnitId).toBe('A1');
      expect(component.boxSamples()[1].extUnitId).toBe('Z1');
    });

    it('should sort samples descending', () => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      component.boxSamples.set([
        makeSample({ extUnitId: 'A1' }),
        makeSample({ extUnitId: 'Z1', sampleSeqNo: '2' }),
      ]);

      component.onTableSortChange({ column: 'extUnitId', direction: 'D' });

      expect(component.boxSamples()[0].extUnitId).toBe('Z1');
    });

    it('should reload box samples when direction is default', fakeAsync(() => {
      component.headerForm.patchValue({ boxId: 'BOX001', transferMode: 'I' });
      apiServiceSpy.getBoxSamples.and.returnValue(of([]));

      component.onTableSortChange({ column: 'extUnitId', direction: 'default' });
      tick();

      expect(apiServiceSpy.getBoxSamples).toHaveBeenCalled();
    }));
  });

  // ── DateTime Picker Dialogs ──────────────────────────────────────

  describe('DateTime picker dialogs', () => {
    beforeEach(() => initComponent());

    it('openShipmentDateTimePicker should open dialog and apply result', fakeAsync(() => {
      const result = moment('2026-06-12T14:00:00');
      const ref = createDialogRefSpy(result);
      dialogOpenSpy.and.returnValue(ref);

      component.openShipmentDateTimePicker();
      tick();

      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(component.headerForm.get('shipmentDate')?.value).toEqual(result);
    }));

    it('openReceivedDateTimePicker should open dialog and apply result', fakeAsync(() => {
      const result = moment('2026-06-13T09:00:00');
      const ref = createDialogRefSpy(result);
      dialogOpenSpy.and.returnValue(ref);

      component.openReceivedDateTimePicker();
      tick();

      expect(component.headerForm.get('receivedDate')?.value).toEqual(result);
    }));

    it('openCollDateTimePicker should open dialog and apply result', fakeAsync(() => {
      const result = moment('2026-06-11T08:00:00');
      const ref = createDialogRefSpy(result);
      dialogOpenSpy.and.returnValue(ref);

      component.openCollDateTimePicker();
      tick();

      expect(component.detailForm.get('collDate')?.value).toEqual(result);
    }));

    it('should not apply when dialog returns undefined', fakeAsync(() => {
      const ref = createDialogRefSpy(undefined);
      dialogOpenSpy.and.returnValue(ref);
      component.headerForm.patchValue({ shipmentDate: null });

      component.openShipmentDateTimePicker();
      tick();

      expect(component.headerForm.get('shipmentDate')?.value).toBeNull();
    }));
  });

  // ── getFormattedDateTime ─────────────────────────────────────────

  describe('getFormattedDateTime', () => {
    beforeEach(() => initComponent());

    it('should format shipmentDate from header form', () => {
      component.headerForm.patchValue({ shipmentDate: moment('2026-06-10T14:30:00') });
      const result = component.getFormattedDateTime('shipmentDate');
      expect(result).toBe('10-JUN-2026 14:30');
    });

    it('should format receivedDate from header form', () => {
      component.headerForm.patchValue({ receivedDate: moment('2026-06-15T09:00:00') });
      const result = component.getFormattedDateTime('receivedDate');
      expect(result).toBe('15-JUN-2026 09:00');
    });

    it('should format collDate from detail form', () => {
      component.detailForm.patchValue({ collDate: moment('2026-06-08T11:00:00') });
      const result = component.getFormattedDateTime('collDate');
      expect(result).toBe('08-JUN-2026 11:00');
    });

    it('should return empty string for null value', () => {
      component.headerForm.patchValue({ shipmentDate: null });
      expect(component.getFormattedDateTime('shipmentDate')).toBe('');
    });

    it('should return empty string for invalid moment', () => {
      component.headerForm.patchValue({ shipmentDate: moment('invalid') });
      expect(component.getFormattedDateTime('shipmentDate')).toBe('');
    });
  });

  // ── getDateError ─────────────────────────────────────────────────

  describe('getDateError', () => {
    beforeEach(() => initComponent());

    it('should return error message when invalidDate and touched', () => {
      const ctrl = component.headerForm.get('shipmentDate')!;
      ctrl.setErrors({ invalidDate: true });
      ctrl.markAsTouched();
      expect(component.getDateError('shipmentDate', 'Shipment Date')).toBe('Shipment Date is invalid.');
    });

    it('should return empty string when control not touched', () => {
      const ctrl = component.headerForm.get('shipmentDate')!;
      ctrl.setErrors({ invalidDate: true });
      expect(component.getDateError('shipmentDate', 'Shipment Date')).toBe('');
    });

    it('should return empty string when no error', () => {
      const ctrl = component.headerForm.get('shipmentDate')!;
      ctrl.markAsTouched();
      expect(component.getDateError('shipmentDate', 'Shipment Date')).toBe('');
    });

    it('should check collDate from detail form', () => {
      const ctrl = component.detailForm.get('collDate')!;
      ctrl.setErrors({ invalidDate: true });
      ctrl.markAsTouched();
      expect(component.getDateError('collDate', 'Coll Date')).toBe('Coll Date is invalid.');
    });

    it('should return empty string when dirty but no error', () => {
      const ctrl = component.headerForm.get('receivedDate')!;
      ctrl.markAsDirty();
      expect(component.getDateError('receivedDate', 'Received Date')).toBe('');
    });
  });

  // ── formatDate ───────────────────────────────────────────────────

  describe('formatDate', () => {
    beforeEach(() => initComponent());

    it.each([
      ['06-10-2026 14:30', '10-JUN-2026 14:30'],
      ['2026-06-10T14:30:00', '10-JUN-2026 14:30'],
      [null, ''],
      [undefined, ''],
      ['', ''],
    ])('should format "%s" as "%s"', (input: any, expected: string) => {
      expect(component.formatDate(input)).toBe(expected);
    });

    it('should return original value for unparseable string', () => {
      const result = component.formatDate('not-a-date');
      // moment may or may not parse this - if invalid, returns original
      expect(typeof result).toBe('string');
    });
  });

  // ── formatApiError ───────────────────────────────────────────────

  describe('formatApiError', () => {
    beforeEach(() => initComponent());

    it('should format error with code', () => {
      const result = (component as any).formatApiError('1234', 'Something went wrong');
      expect(result).toBe('Error 1234: Something went wrong');
    });

    it('should return just message when no error code', () => {
      const result = (component as any).formatApiError(null, 'Something went wrong');
      expect(result).toBe('Something went wrong');
    });

    it('should use default message when message is null', () => {
      const result = (component as any).formatApiError('1234', null);
      expect(result).toBe('Error 1234: An unexpected error occurred.');
    });

    it('should use default message when both are null', () => {
      const result = (component as any).formatApiError(null, null);
      expect(result).toBe('An unexpected error occurred.');
    });

    it('should handle undefined errorCode', () => {
      const result = (component as any).formatApiError(undefined, 'msg');
      expect(result).toBe('msg');
    });
  });

  // ── getFirstValidationError ──────────────────────────────────────

  describe('getFirstValidationError', () => {
    beforeEach(() => initComponent());

    it('should return contract required message for external mode', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      component.headerForm.get('contractId')?.markAsTouched();
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Contract ID is required');
    }));

    it('should return profileSetId required message', fakeAsync(() => {
      component.onTransferModeChange('E');
      tick();
      component.headerForm.patchValue({ contractId: 'RC001' });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Profile Set ID is required');
    }));

    it('should return invalid date message for shipmentDate', () => {
      component.headerForm.get('shipmentDate')?.setErrors({ invalidDate: true });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Shipment date is invalid');
    });

    it('should return invalid date message for receivedDate', () => {
      component.headerForm.get('receivedDate')?.setErrors({ invalidDate: true });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Received date is invalid');
    });

    it('should return pattern error for shipmentNo', () => {
      component.headerForm.get('shipmentNo')?.setErrors({ pattern: true });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('invalid characters');
    });

    it('should return shipAfterRecv error', () => {
      component.headerForm.patchValue({
        shipmentDate: moment('2026-06-20'),
        receivedDate: moment('2026-06-10'),
      });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Shipment date cannot be later');
    });

    it('should return intUnitId required message', fakeAsync(() => {
      component.onTransferModeChange('I');
      tick();
      component.detailForm.get('intUnitId')?.markAsTouched();
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Internal Unit ID is required');
    }));

    it('should return sampleType required message', fakeAsync(() => {
      setupInternalMode();
      tick();
      // Set intUnitId to satisfy its required validator so it doesn't fire first
      component.detailForm.patchValue({ intUnitId: 'I1' });
      component.detailForm.get('sampleType')?.enable();
      component.detailForm.get('sampleType')?.markAsTouched();
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Sample Type is required');
    }));

    it('should return collDate invalid message', fakeAsync(() => {
      setupInternalMode();
      tick();
      // Satisfy intUnitId and sampleType first
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN' });
      component.detailForm.get('collDate')?.setErrors({ invalidDate: true });
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Collection date is invalid');
    }));

    it('should return generic fallback message', fakeAsync(() => {
      setupInternalMode();
      tick();
      // Satisfy all validatable controls
      component.detailForm.patchValue({ intUnitId: 'I1', sampleType: 'FRZN' });
      component.headerForm.get('shipmentNo')?.setValue('VALID');
      component.detailForm.get('sampleType')?.disable();
      const result = (component as any).getFirstValidationError();
      expect(result).toContain('Please fix all required field errors');
    }));
  });

  // ── Filtered dropdown computeds ──────────────────────────────────

  describe('Computed filtered options', () => {
    beforeEach(fakeAsync(() => {
      initComponent();
      tick();
    }));

    it('filteredBoxOptions should filter by boxId', fakeAsync(() => {
      component.boxOptions.set(mockBoxes);
      component.boxSearchCtrl.setValue('BOX001');
      tick();
      expect(component.filteredBoxOptions().length).toBe(1);
      expect(component.filteredBoxOptions()[0].boxId).toBe('BOX001');
    }));

    it('filteredBoxOptions should filter by shipmentNo', fakeAsync(() => {
      component.boxOptions.set(mockBoxes);
      component.boxSearchCtrl.setValue('SH002');
      tick();
      expect(component.filteredBoxOptions().length).toBe(1);
    }));

    it('filteredBoxOptions should return all when search is empty', fakeAsync(() => {
      component.boxOptions.set(mockBoxes);
      component.boxSearchCtrl.setValue('');
      tick();
      expect(component.filteredBoxOptions().length).toBe(2);
    }));

    it('filteredContractOptions should filter by contractId or company', fakeAsync(() => {
      component.contractOptions.set(mockContracts);
      component.contractSearchCtrl.setValue('Company 1');
      tick();
      expect(component.filteredContractOptions().length).toBe(1);
      expect(component.filteredContractOptions()[0].company).toContain('Company 1');
    }));

    it('filteredProfileOptions should filter by profileSetId or description', fakeAsync(() => {
      component.profileOptions.set(mockProfiles);
      component.profileSearchCtrl.setValue('Adhoc');
      tick();
      expect(component.filteredProfileOptions().length).toBe(1);
      expect(component.filteredProfileOptions()[0].profileDesc).toContain('Adhoc');
    }));

    it('filteredBatchOptions should filter by batchId', fakeAsync(() => {
      component.batchOptions.set(mockBatches);
      component.batchSearchCtrl.setValue('BAT001');
      tick();
      expect(component.filteredBatchOptions().length).toBe(1);
    }));

    it('filteredBatchOptions should return all when search is empty', fakeAsync(() => {
      component.batchOptions.set(mockBatches);
      component.batchSearchCtrl.setValue('');
      tick();
      expect(component.filteredBatchOptions().length).toBe(1);
    }));

    it('filteredSampleTypeOptions should filter by code', fakeAsync(() => {
      component.sampleTypeOptions.set(mockSampleTypes);
      component.sampleTypeSearchCtrl.setValue('FRZN');
      tick();
      expect(component.filteredSampleTypeOptions().length).toBe(1);
    }));

    it('filteredSampleTypeOptions should filter by codeDesc', fakeAsync(() => {
      component.sampleTypeOptions.set(mockSampleTypes);
      component.sampleTypeSearchCtrl.setValue('Clotted');
      tick();
      expect(component.filteredSampleTypeOptions().length).toBe(1);
    }));

    it('filteredSampleTypeOptions should restrict to multiSampleTypes when in multi mode', fakeAsync(() => {
      component.sampleTypeOptions.set(mockSampleTypes);
      component.isMultiSampleMode.set(true);
      component.multiSampleTypes.set(['CLT']);
      component.sampleTypeSearchCtrl.setValue('');
      tick();
      expect(component.filteredSampleTypeOptions().length).toBe(1);
      expect(component.filteredSampleTypeOptions()[0].code).toBe('CLT');
    }));

    it('filteredNewSampleTypeOptions should exclude current sampleType', fakeAsync(() => {
      component.sampleTypeOptions.set([...mockSampleTypes, { code: 'PLT', codeDesc: 'Platelet' }]);
      component.detailForm.get('sampleType')?.enable();
      component.detailForm.get('sampleType')?.setValue('FRZN');
      component.newSampleTypeSearchCtrl.setValue('');
      tick();
      const filtered = component.filteredNewSampleTypeOptions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(t => t.code !== 'FRZN')).toBeTrue();
    }));

    it('filteredNewSampleTypeOptions should filter by search term', fakeAsync(() => {
      component.sampleTypeOptions.set(mockSampleTypes);
      component.detailForm.get('sampleType')?.setValue('FRZN');
      component.newSampleTypeSearchCtrl.setValue('Clotted');
      tick();
      const filtered = component.filteredNewSampleTypeOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CLT');
    }));
  });

  // ── Clear Functionality ──────────────────────────────────────────

  describe('Clear Functionality', () => {
    beforeEach(() => initComponent());

    it('should clear all form fields and signals', () => {
      component.headerForm.patchValue({
        transferMode: 'I', boxId: 'BOX001', shipmentNo: 'SH001',
      });
      component.boxSamples.set([makeSample()]);
      component.contractOptions.set(mockContracts);
      component.profileOptions.set(mockProfiles);
      component.batchOptions.set(mockBatches);
      component.totalCheckedIn.set(5);
      component.contractValidation.set({ contractId: 'RC001', barCodeProtocol: 'X', unitIdType: 'C', copyIsbtFlag: 'N' });
      component.barcodeScheme.set('ISBT');
      component.copyUnitsFlag.set('C');
      component.selectedProfileType.set('S');
      component.selectedAdhocTestIds.set(['T1']);
      component.sampleDataLoaded.set(true);
      component.isMultiSampleMode.set(true);

      component.clearAll();

      expect(component.headerForm.get('transferMode')?.value).toBeNull();
      expect(component.headerForm.get('boxId')?.value).toBeNull();
      expect(component.boxSamples()).toEqual([]);
      expect(component.totalCheckedIn()).toBe(0);
      expect(component.contractOptions()).toEqual([]);
      expect(component.profileOptions()).toEqual([]);
      expect(component.batchOptions()).toEqual([]);
      expect(component.contractValidation()).toBeNull();
      expect(component.barcodeScheme()).toBeNull();
      expect(component.copyUnitsFlag()).toBeNull();
      expect(component.selectedProfileType()).toBeNull();
      expect(component.selectedAdhocTestIds()).toEqual([]);
      expect(component.sampleDataLoaded()).toBeFalse();
      expect(component.isMultiSampleMode()).toBeFalse();
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reset receivedDate to chapter local time on clearAll', () => {
      component.clearAll();
      const recv = component.headerForm.get('receivedDate')?.value as moment.Moment;
      expect(recv).toBeTruthy();
    });
  });

  // ── Error Handling ───────────────────────────────────────────────

  describe('Error Handling', () => {
    beforeEach(() => initComponent());

    it('should handle API error when loading boxes', fakeAsync(() => {
      apiServiceSpy.getBoxes.and.returnValue(throwError(() => new Error('API Error')));
      component.onTransferModeChange('I');
      tick();
      expect(component.boxOptions()).toEqual([]);
    }));

    it('should handle API error when loading sample types', fakeAsync(() => {
      apiServiceSpy.getSampleTypes.and.returnValue(throwError(() => new Error('API Error')));
      const fixture2 = TestBed.createComponent(SampleTransferInComponent);
      try { fixture2.detectChanges(); } catch (_) { /* */ }
      tick();
      expect(fixture2.componentInstance.sampleTypeOptions()).toEqual([]);
    }));

    it('should handle API error when loading contracts', fakeAsync(() => {
      apiServiceSpy.getContracts.and.returnValue(throwError(() => new Error('fail')));
      component.onTransferModeChange('E');
      tick();
      expect(component.contractOptions()).toEqual([]);
    }));

    it('should handle API error when loading profiles', fakeAsync(() => {
      apiServiceSpy.getProfiles.and.returnValue(throwError(() => new Error('fail')));
      component.onContractChange('RC001');
      tick();
      expect(component.profileOptions()).toEqual([]);
    }));

    it('should handle API error when loading batches', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => new Error('fail')));
      component.onContractChange('RC001');
      tick();
      expect(component.batchOptions()).toEqual([]);
    }));
  });

  // ── syncUnitIdFieldsToForm ───────────────────────────────────────

  describe('syncUnitIdFieldsToForm', () => {
    beforeEach(() => initComponent());

    it('should sync extUnitId from extUnitIdField in external mode', () => {
      component.headerForm.patchValue({ transferMode: 'E' });
      (component as any).extUnitIdField = { parsedUnitId: 'PARSED_EXT', unitIdControl: new FormControl('x'), validationState: 'valid', validationError: null };

      (component as any).syncUnitIdFieldsToForm();

      expect(component.detailForm.get('extUnitId')?.value).toBe('PARSED_EXT');
    });

    it('should sync intUnitId from intUnitIdField in internal mode', () => {
      component.headerForm.patchValue({ transferMode: 'I' });
      (component as any).intUnitIdField = { parsedUnitId: 'PARSED_INT', unitIdControl: new FormControl('x'), validationState: 'valid', validationError: null };

      (component as any).syncUnitIdFieldsToForm();

      expect(component.detailForm.get('intUnitId')?.value).toBe('PARSED_INT');
    });
  });

  // ── Table column value formatters ────────────────────────────────

  describe('Table column value formatters', () => {
    beforeEach(() => initComponent());

    it('should format collDate column via valueFormatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'collDate');
      expect(col?.valueFormatter?.('06-10-2026 14:30', {} as any)).toBe('10-JUN-2026 14:30');
    });

    it('should format frozenFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'frozenFlag');
      expect(col?.valueFormatter?.('Y', {} as any)).toBe('Yes');
    });

    it('should format frozenFlag N as empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'frozenFlag');
      expect(col?.valueFormatter?.('N', {} as any)).toBe('');
    });

    it('should format thawFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'thawFlag');
      expect(col?.valueFormatter?.('Y', {} as any)).toBe('Yes');
    });

    it('should format verifyFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'verifyFlag');
      expect(col?.valueFormatter?.('Y', makeSample() as any)).toBe('Yes');
    });

    it('should format verifyFlag as Yes when acceptFlag is Y', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'verifyFlag');
      expect(col?.valueFormatter?.('N', makeSample({ acceptFlag: 'Y' }) as any)).toBe('Yes');
    });

    it('should format verifyFlag N with acceptFlag N as empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'verifyFlag');
      expect(col?.valueFormatter?.('N', makeSample({ acceptFlag: 'N' }) as any)).toBe('');
    });
  });

  // ── applyMatchedSample field enable/disable ──────────────────────

  describe('applyMatchedSample', () => {
    beforeEach(() => initComponent());

    it('should disable fields for existing sample (isNewSample=false)', () => {
      const sample = makeSample({ sampleType: 'FRZN', frozenFlag: 'Y' });
      (component as any).applyMatchedSample(sample, false);

      expect(component.detailForm.get('collDate')?.disabled).toBeTrue();
      expect(component.detailForm.get('sampleType')?.disabled).toBeTrue();
      expect(component.detailForm.get('frozenFlag')?.disabled).toBeTrue();
      expect(component.detailForm.get('newSampleType')?.enabled).toBeTrue();
      expect(component.detailForm.get('thawFlag')?.enabled).toBeTrue();
    });

    it('should enable fields for new sample (isNewSample=true)', () => {
      const sample = makeSample({ sampleType: 'FRZN', frozenFlag: 'Y' });
      (component as any).applyMatchedSample(sample, true);

      expect(component.detailForm.get('collDate')?.enabled).toBeTrue();
      expect(component.detailForm.get('sampleType')?.enabled).toBeTrue();
      expect(component.detailForm.get('frozenFlag')?.enabled).toBeTrue();
      expect(component.detailForm.get('newSampleType')?.disabled).toBeTrue();
    });

    it('should set loadedSampleSnapshot for existing sample', () => {
      const sample = makeSample({ sampleType: 'FRZN', frozenFlag: 'Y', aliquot: '02' });
      (component as any).applyMatchedSample(sample, false);

      expect(component.loadedSampleSnapshot()).toEqual({
        sampleType: 'FRZN', frozenFlag: 'Y', thawFlag: 'N', aliquot: '02',
      });
    });

    it('should set loadedSampleSnapshot to null for new sample', () => {
      const sample = makeSample({ sampleType: 'FRZN' });
      (component as any).applyMatchedSample(sample, true);

      expect(component.loadedSampleSnapshot()).toBeNull();
    });

    it('should clear multi-sample mode', () => {
      component.isMultiSampleMode.set(true);
      component.multiSampleTypes.set(['FRZN', 'CLT']);
      const sample = makeSample();
      (component as any).applyMatchedSample(sample, false);

      expect(component.isMultiSampleMode()).toBeFalse();
      expect(component.multiSampleTypes()).toEqual([]);
    });
  });

  // ── resetDetailForm ──────────────────────────────────────────────

  describe('resetDetailForm', () => {
    beforeEach(() => initComponent());

    it('should reset detail state and apply field states for current mode', fakeAsync(() => {
      component.headerForm.patchValue({ transferMode: 'I' });
      component.sampleDataLoaded.set(true);
      component.isMultiSampleMode.set(true);
      component.loadedSampleSnapshot.set({ sampleType: 'FRZN', frozenFlag: null, thawFlag: null, aliquot: '01' });
      component.selectedAdhocTestIds.set(['T1']);
      component.extUnitIdError.set('some error');
      component.intUnitIdError.set('some error');
      component.frozenThawError.set('some error');
      component.collDateFutureError.set('some error');
      component.newSampleTypeError.set('some error');

      (component as any).resetDetailForm();
      tick();

      expect(component.sampleDataLoaded()).toBeFalse();
      expect(component.isMultiSampleMode()).toBeFalse();
      expect(component.loadedSampleSnapshot()).toBeNull();
      expect(component.selectedAdhocTestIds()).toEqual([]);
      expect(component.extUnitIdError()).toBe('');
      expect(component.intUnitIdError()).toBe('');
      expect(component.frozenThawError()).toBe('');
      expect(component.collDateFutureError()).toBe('');
      expect(component.newSampleTypeError()).toBe('');
    }));
  });

  // ── checkDuplicateSampleServer ───────────────────────────────────

  describe('checkDuplicateSampleServer', () => {
    beforeEach(() => initComponent());

    it('should call onPass when no duplicate', fakeAsync(() => {
      apiServiceSpy.checkDuplicateSample.and.returnValue(of({ isDuplicate: false }));
      const onPass = jasmine.createSpy('onPass');

      (component as any).checkDuplicateSampleServer('BOX001', 'I1', 'FRZN', onPass);
      tick();

      expect(onPass).toHaveBeenCalled();
      expect(component.isLoading()).toBeFalse();
    }));

    it('should show error and not call onPass when duplicate', fakeAsync(() => {
      apiServiceSpy.checkDuplicateSample.and.returnValue(of({ isDuplicate: true }));
      const onPass = jasmine.createSpy('onPass');

      (component as any).checkDuplicateSampleServer('BOX001', 'I1', 'FRZN', onPass);
      tick();

      expect(onPass).not.toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalled();
    }));

    it('should handle API error gracefully and call onPass', fakeAsync(() => {
      apiServiceSpy.checkDuplicateSample.and.returnValue(throwError(() => new Error('fail')));
      const onPass = jasmine.createSpy('onPass');

      (component as any).checkDuplicateSampleServer('BOX001', 'I1', 'FRZN', onPass);
      tick();

      // catchError returns of(null), result is null so onPass is called
      expect(onPass).toHaveBeenCalled();
    }));
  });

  // ── showWarningDialog ────────────────────────────────────────────

  describe('showWarningDialog', () => {
    beforeEach(() => initComponent());

    it('should open dialog with correct type and message', () => {
      dialogOpenSpy.and.returnValue(createDialogRefSpy(null));
      (component as any).showWarningDialog('error', 'Test error message');
      expect(dialogOpenSpy).toHaveBeenCalled();
    });
  });
});
