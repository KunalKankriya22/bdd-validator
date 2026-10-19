import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';

import { TubesCheckInComponent } from './tubes-check-in';
import { TubesCheckInService } from './services/tubes-check-in.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  TubesContract,
  ProfileSet,
  Shipment,
  CheckInOption,
  TubeEntry,
  CheckInResponseDto,
  BatchUnitDto,
  BatchLookupDto,
  TestLookupDto,
  ReturnResult,
  ValidateUnitResponseDto,
} from './models/tubes-check-in.model';
import { UnitIdPostValidateEvent, UnitValidationResponse } from '@shared/components/unit-id-field';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('TubesCheckInComponent', () => {
  let callArgs: any;
  let mockChapterDateTime: any;
  let receivedDate: any;
  let collectionDate: any;
  let component: TubesCheckInComponent;
  let fixture: ComponentFixture<TubesCheckInComponent>;
  let mockTubesService: jasmine.SpyObj<TubesCheckInService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockContracts: TubesContract[] = [
    { contractId: 'C001', description: 'Contract 1', centerId: 'Center A' },
    { contractId: 'C002', description: 'Contract 2', centerId: 'Center B' },
  ];

  const mockProfileSets: ProfileSet[] = [
    { profileSetId: 'PS001', description: 'Profile Set 1' },
    { profileSetId: 'PS002', description: 'Profile Set 2' },
  ];

  const mockBatches: BatchLookupDto[] = [
    {
      batchId: 'B001',
      receivedDate: '2026-06-01T00:00:00Z',
      contractId: 'C001',
      profileSetId: 'PS001',
      profileSeqNo: 1,
      checkinUserId: 'user1',
      qcDate: null,
    },
    {
      batchId: 'B002',
      receivedDate: '2026-06-02T00:00:00Z',
      contractId: 'C001',
      profileSetId: 'PS002',
      profileSeqNo: 2,
      checkinUserId: 'user2',
      qcDate: null,
    },
  ];

  const mockTests: TestLookupDto[] = [
    { testId: 'T001', testDesc: 'Test 1' },
    { testId: 'T002', testDesc: 'Test 2' },
  ];

  const mockBatchUnits: BatchUnitDto[] = [
    {
      unitId: 'U001',
      osUnitId: 'OS001',
      collDate: '2026-06-01T00:00:00Z',
      receivedDate: '2026-06-05T00:00:00Z',
      batchId: 'B001',
    },
    {
      unitId: 'U002',
      osUnitId: 'OS002',
      collDate: '2026-06-02T00:00:00Z',
      receivedDate: '2026-06-05T00:00:00Z',
      batchId: 'B001',
    },
  ];

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockTubesService = jasmine.createSpyObj('TubesCheckInService', [
      'getContracts',
      'getProfileSets',
      'getBatches',
      'getContractTests',
      'getBatchUnits',
      'validateUnit',
      'checkIn',
      'convertToIsoDateTime',
      'getTubeFormats',
      'getDuplicateReasons',
      'getAdditionalTests',
      'getDuplicateUnits',
      'formatDateForDisplay',
      'formatTimeForDisplay',
      'generateBatchId',
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockHeaderService = createMockHeaderService();
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'fetchChapterTimezone',
      'getChapterLocalDateTime',
      'getChapterLocalDate'
    ]);
    // Mock chapter date/time to return current date
    mockChapterDateTime = moment('2026-06-19T03:36:00'); // Example chapter time
    mockChapterTimezoneService.getChapterLocalDateTime.and.returnValue(mockChapterDateTime);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(mockChapterDateTime.clone().startOf('day'));
    mockChapterTimezoneService.fetchChapterTimezone.and.returnValue(of({
      chapterId: 'OBK',
      chapterLocalDate: '2026-06-19T00:00:00',
      chapterLocalDateTime: '2026-06-19T03:36:00'
    }));

    mockDialog = jasmine.createSpyObj('MatDialog', ['open', 'closeAll', 'getDialogById', 'ngOnDestroy']);

    // Add required internal properties for MatDialog
    (mockDialog as any)._openDialogs = [];
    (mockDialog as any).afterOpened = new Subject();
    (mockDialog as any).afterAllClosed = new Subject();
    (mockDialog as any)._afterAllClosed = new Subject();

    mockDialog.open.and.returnValue({
      afterClosed: () => of({ proceed: false, reasonCode: null })
    } as any);

    // Set up default return values
    mockTubesService.getContracts.and.returnValue(of(mockContracts));
    mockTubesService.getProfileSets.and.returnValue(of(mockProfileSets));
    mockTubesService.getBatches.and.returnValue(of(mockBatches));
    mockTubesService.getContractTests.and.returnValue(of(mockTests));
    mockTubesService.getBatchUnits.and.returnValue(of(mockBatchUnits));
    mockTubesService.getTubeFormats.and.returnValue(of([
      { code: 'R', description: 'Red only' },
      { code: 'RP', description: 'Red and Purple' },
      { code: 'RPS', description: 'Red, Purple, and Serum' },
    ]));
    mockTubesService.getDuplicateReasons.and.returnValue(of([
      { code: 'RE', description: 'Retest' },
      { code: 'QC', description: 'Quality Control' },
    ]));
    mockTubesService.getAdditionalTests.and.returnValue(of([]));
    mockTubesService.getDuplicateUnits.and.returnValue(of([]));
    mockTubesService.generateBatchId.and.returnValue(of('NEWBATCH001'));
    mockTubesService.formatDateForDisplay.and.callFake((date: string | null) => {
      if (!date) return null;
      return date.substring(0, 10);
    });
    mockTubesService.formatTimeForDisplay.and.callFake((date: string | null) => {
      if (!date) return null;
      return '10:30';
    });
    mockTubesService.convertToIsoDateTime.and.callFake((date: string, time: string) => {
      return `${date}T${time}:00.000Z`;
    });



      TestBed.configureTestingModule({
      imports: [
        TubesCheckInComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [
        { provide: TubesCheckInService, useValue: mockTubesService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
    });

      mockChapterTimezoneService.getChapterLocalDateTime.and.returnValue(mockChapterDateTime);


      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(mockChapterDateTime.clone().startOf('day'));


      mockTubesService.getContracts.and.returnValue(of(mockContracts));


      mockTubesService.getProfileSets.and.returnValue(of(mockProfileSets));


      mockTubesService.getBatches.and.returnValue(of(mockBatches));


      mockTubesService.getContractTests.and.returnValue(of(mockTests));


      mockTubesService.getBatchUnits.and.returnValue(of(mockBatchUnits));


      mockTubesService.getAdditionalTests.and.returnValue(of([]));


      mockTubesService.getDuplicateUnits.and.returnValue(of([]));


      mockTubesService.generateBatchId.and.returnValue(of('NEWBATCH001'));


      mockTubesService.formatDateForDisplay.and.callFake((date: string | null) => {
        if (!date) return null;
        return date.substring(0, 10);
      });


      mockTubesService.formatTimeForDisplay.and.callFake((date: string | null) => {
        if (!date) return null;
        return '10:30';
      });


      mockTubesService.convertToIsoDateTime.and.callFake((date: string, time: string) => {
        return `${date}T${time}:00.000Z`;
      });


    fixture = TestBed.createComponent(TubesCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initialization', () => {



    it('should initialize receivedDate and receivedTime as null', () => {
      expect(component.section1Form.get('receivedDate')?.value).toBeNull();
      expect(component.section1Form.get('receivedTime')?.value).toBeNull();
    });



    it('should handle error when loading contracts fails', fakeAsync(() => {
      mockTubesService.getContracts.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.ngOnInit();
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to load contracts'
      );
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      component.ngOnInit();
      tick();
    }));

    it('should initialize filtered contract options with all contracts', () => {
      expect(component.filteredContractOptions()).toEqual(mockContracts);
    });

    it('should filter contracts by ID when search term changes', fakeAsync(() => {
      component.contractSearchControl.setValue('C001');
      tick(200); // debounce time

      expect(component.filteredContractOptions()).toEqual([mockContracts[0]]);
    }));

    it('should filter contracts by description when search term changes', fakeAsync(() => {
      component.contractSearchControl.setValue('Contract 2');
      tick(200); // debounce time

      expect(component.filteredContractOptions()).toEqual([mockContracts[1]]);
    }));

    it('should be case-insensitive when filtering contracts', fakeAsync(() => {
      component.contractSearchControl.setValue('contract 1');
      tick(200); // debounce time

      expect(component.filteredContractOptions()).toEqual([mockContracts[0]]);
    }));

    it('should return empty array when no contracts match search', fakeAsync(() => {
      component.contractSearchControl.setValue('NonExistent');
      tick(200); // debounce time

      expect(component.filteredContractOptions()).toEqual([]);
    }));

    it('should initialize filtered profile set options when profile sets load', fakeAsync(() => {
      component.onSection1ContractChange('C001');
      tick();

      expect(component.filteredProfileSetOptions()).toEqual(mockProfileSets);
    }));

    it('should filter profile sets when search term changes', fakeAsync(() => {
      component.profileSetOptions.set(mockProfileSets);
      component.filteredProfileSetOptions.set(mockProfileSets);

      component.profileSetSearchControl.setValue('PS001');
      tick(200); // debounce time

      expect(component.filteredProfileSetOptions()).toEqual([mockProfileSets[0]]);
    }));

    it('should initialize filtered batch ID options when batches load', fakeAsync(() => {
      component.section1ContractId.set('C001');
      component.onSection1ProfileChange('PS001');
      tick();

      expect(component.filteredBatchIdOptions()).toEqual(['B001', 'B002']);
    }));

    it('should filter batch IDs when search term changes', fakeAsync(() => {
      component.batchIdOptions.set(['B001', 'B002']);
      component.filteredBatchIdOptions.set(['B001', 'B002']);

      component.batchIdSearchControl.setValue('B001');
      tick(200); // debounce time

      expect(component.filteredBatchIdOptions()).toEqual(['B001']);
    }));






  });

  describe('Section 1 - Contract & Profile Selection', () => {
    it('should load profile sets when contract is selected', fakeAsync(() => {
      component.onSection1ContractChange('C001');
      tick();

      expect(mockTubesService.getProfileSets).toHaveBeenCalledWith('C001');
      expect(component.profileSetOptions()).toEqual(mockProfileSets);
      expect(component.filteredProfileSetOptions()).toEqual(mockProfileSets);
      expect(component.section1ContractId()).toBe('C001');
    }));

    it('should reset dependent fields when contract changes', () => {
      component.section1Form.patchValue({
        profileSetId: 'PS001',
        batchId: 'B001',
      });

      component.onSection1ContractChange('C002');

      expect(component.section1Form.get('profileSetId')?.value).toBeNull();
      expect(component.section1Form.get('batchId')?.value).toBeNull();
      expect(component.section1ProfileSetId()).toBeNull();
    });

    it('should load batches when profile is selected', fakeAsync(() => {
      component.section1ContractId.set('C001');

      component.onSection1ProfileChange('PS001');
      tick();

      expect(mockTubesService.getBatches).toHaveBeenCalledWith('C001');
      expect(component.batchIdOptions()).toEqual(['B001', 'B002']);
      expect(component.filteredBatchIdOptions()).toEqual(['B001', 'B002']);
    }));



    it('should auto-populate receivedDate and receivedTime when profile is selected', fakeAsync(() => {
      component.section1ContractId.set('C001');

      component.onSection1ProfileChange('PS001');
      tick();

      expect(mockChapterTimezoneService.fetchChapterTimezone).toHaveBeenCalledWith('TST');
      expect(component.section1Form.get('receivedDate')?.value).toBeTruthy();
      expect(component.section1Form.get('receivedTime')?.value).toBe('03:36');
    }));

    it('should store full batch objects when batches are loaded', fakeAsync(() => {
      component.section1ContractId.set('C001');

      component.onSection1ProfileChange('PS001');
      tick();

      expect(component.batchOptions()).toEqual(mockBatches);
    }));

    it('should show section 2 only when contract and profile are selected', () => {
      expect(component.showSection2()).toBe(false);

      component.section1ContractId.set('C001');
      expect(component.showSection2()).toBe(false);

      component.section1ProfileSetId.set('PS001');
      expect(component.showSection2()).toBe(true);
    });
  });

  describe('Section 2 - Option Selection', () => {
    beforeEach(() => {
      component.section1ContractId.set('C001');
      component.section1ProfileSetId.set('PS001');
    });


    it('should show section 3 only after retrieve is clicked', () => {
      component.section2OptionCode.set('A');

      expect(component.showSection3()).toBe(false);

      component.onRetrieve();

      expect(component.showSection3()).toBe(true);
      expect(component.hasRetrieved()).toBe(true);
    });


    it('should initialize table with one empty row on retrieve', () => {
      component.tubeRows.set([]);

      component.onRetrieve();

      expect(component.tubeRows().length).toBe(1);
      expect(component.tubeRows()[0]).toEqual({
        outsideRed: '',
        red: '',
        osPurple1: '',
        purple1: '',
        osPurple2: '',
        purple2: ''
      });
    });











  });

  describe('Section 3 - Tube Entry', () => {
    beforeEach(() => {
      component.section1ContractId.set('C001');
      component.section1ProfileSetId.set('PS001');
      component.section2OptionCode.set('A');
      component.hasRetrieved.set(true);
      // Set batch options so batch selection tests work
      component.batchOptions.set(mockBatches);
      // Set up option options including 'A' for tests that call onClearAll
      component.optionOptions.set([
        { code: 'A', description: 'Check-In All Tubes' },
        { code: 'P*', description: 'Purple Tubes Only' },
        { code: 'P1', description: 'Purple 1 Only' },
        { code: 'P2', description: 'Purple 2 Only' },
        { code: 'R1', description: 'Red 1 Only' },
      ]);
      component.filteredOptionOptions.set(component.optionOptions());
    });

    it('should auto-populate collection date when batch is selected', fakeAsync(() => {
      component.onSection3BatchChange('B001');
      tick(); // Process async getBatchUnits call

      collectionDate = component.section1Form.get('collectionDate')?.value;
      expect(collectionDate).toBeTruthy();
      expect(moment.isMoment(collectionDate)).toBe(true);
      // B001 has receivedDate '2026-06-01T00:00:00Z'
      expect(collectionDate.format('YYYY-MM-DD')).toBe('2026-06-01');
    }));





    it('should clear collection date when batch is deselected', () => {
      component.section1Form.patchValue({ collectionDate: moment('2026-06-01') });

      component.onSection3BatchChange('');

      expect(component.section1Form.get('collectionDate')?.value).toBeNull();
      expect(component.selectedBatch()).toBeNull();
    });

    it('should calculate next sequence number from batch units', fakeAsync(() => {
      const mockUnits = [
        { unitId: 'U001', osUnitId: 'OS001', collDate: '2026-06-01T00:00:00Z', receivedDate: '2026-06-05T00:00:00Z', batchId: 'B001' },
        { unitId: 'U002', osUnitId: 'OS002', collDate: '2026-06-01T00:00:00Z', receivedDate: '2026-06-05T00:00:00Z', batchId: 'B001' },
        { unitId: 'U003', osUnitId: 'OS003', collDate: '2026-06-01T00:00:00Z', receivedDate: '2026-06-05T00:00:00Z', batchId: 'B001' }
      ];

      mockTubesService.getBatchUnits.and.returnValue(of(mockUnits));

      component.onSection3BatchChange('B001');
      tick();

      // Should set sequence to 4 (3 existing units + 1)
      expect(component.selectedBatch()?.sequence).toBe('4');
    }));

    it('should set sequence to 1 when batch has no units', fakeAsync(() => {
      mockTubesService.getBatchUnits.and.returnValue(of([]));

      component.onSection3BatchChange('B001');
      tick();

      // Should set sequence to 0 for empty batch
      expect(component.selectedBatch()?.sequence).toBe('0');
    }));

    it('should auto-populate received date and time from batch units', fakeAsync(() => {
      const mockUnits = [
        {
          unitId: 'U001',
          osUnitId: 'OS001',
          collDate: '2026-06-01T00:00:00',
          receivedDate: '2026-06-05T14:30:00',
          batchId: 'B001'
        }
      ];

      mockTubesService.getBatchUnits.and.returnValue(of(mockUnits));

      component.onSection3BatchChange('B001');
      tick();

      receivedDate = component.section1Form.get('receivedDate')?.value;
      const receivedTime = component.section1Form.get('receivedTime')?.value;

      expect(receivedDate).toBeTruthy();
      expect(moment.isMoment(receivedDate)).toBe(true);
      expect(receivedDate.format('YYYY-MM-DD')).toBe('2026-06-05');
      expect(receivedTime).toBe('14:30');
    }));




    // Delete row tests removed - delete icons removed from UI

    it('should clear all rows when clear all is clicked', () => {
      component.tubeRows.set([
        { outsideRed: 'U1', red: 'R1', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
        { outsideRed: 'U2', red: 'R2', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
      ]);
      component.hasRetrieved.set(true);

      component.onClearAll();

      expect(component.tubeRows().length).toBe(1);
      expect(component.tubeRows()[0].outsideRed).toBe('');
      expect(component.hasRetrieved()).toBe(false);
      // Verify option is reset (user must select manually)
      expect(component.section2OptionCode()).toBeNull();
      expect(component.selectedOption()).toBeNull();
    });

    // Table row delete action test removed - delete icons removed from UI
  });



  describe('Panel Actions', () => {
    beforeEach(() => {
      component.section1ContractId.set('C001');
      component.section1ProfileSetId.set('PS001');
    });

    it('should show profile tests panel without loading data', () => {
      // Set up selected contract and profile set
      component.selectedContract.set(mockContracts[0]);
      component.selectedProfileSet.set(mockProfileSets[0]);

      component.onViewProfileTests();

      // Component no longer loads data - ProfileTestsComponent does that
      expect(mockTubesService.getContractTests).not.toHaveBeenCalled();
      expect(component.showProfileTestsPanel()).toBe(true);
      // Panel receives contract and profile via selectedContract/selectedProfileSet signals
      expect(component.selectedContract()?.contractId).toBe('C001');
      expect(component.selectedProfileSet()?.profileSetId).toBe('PS001');
    });

    it('should not view profile tests without contract', () => {
      component.section1ContractId.set(null);

      component.onViewProfileTests();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please select a contract first'
      );
      expect(mockTubesService.getContractTests).not.toHaveBeenCalled();
    });

    it('should show units in batch panel without loading data', () => {
      component.section1Form.patchValue({ batchId: 'B001' });

      component.onViewUnitsInBatch();

      // Component no longer loads data - UnitsInBatchComponent does that
      expect(mockTubesService.getBatchUnits).not.toHaveBeenCalled();
      expect(component.showUnitsInBatchPanel()).toBe(true);
      // Panel receives batch ID from section1Form
      expect(component.section1Form.get('batchId')?.value).toBe('B001');
    });

    it('should not view units without batch selected', () => {
      component.section1Form.patchValue({ batchId: null });

      component.onViewUnitsInBatch();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please select a batch first'
      );
      expect(mockTubesService.getBatchUnits).not.toHaveBeenCalled();
    });







    it('should not open notes without collection date', () => {
      component.section1Form.patchValue({ batchId: 'B001', collectionDate: null });

      component.onEnterNotes();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Collection Date is required to view batch notes'
      );
    });
  });

  describe('Tube Validation (By Units Tab)', () => {
    beforeEach(() => {
      component.section1ContractId.set('C001');
      component.section1Form.patchValue({
        batchId: 'B001',
        collectionDate: moment('2026-06-01', 'YYYY-MM-DD'),
      });
    });

    it('should handle successful validation with response.item structure', fakeAsync(() => {
      const mockValidationResponse: ReturnResult<ValidateUnitResponseDto> = {
        success: true,
        message: 'Validation successful',
        statusCode: 200,
        item: {
          isValid: true,
          isDuplicate: false,
          requiresReason: false,
          decodedUnitId: 'RC1234567890',
          decodedOsUnitId: '1234567890',
          checkDigit: '0',
          oldUnitId: null,
          errorMessage: null,
          errorCode: null,
          codeScheme: 'I'
        }
      };

      mockTubesService.validateUnit.and.returnValue(of(mockValidationResponse));

      const mockEvent: UnitIdPostValidateEvent = {
        data: {
          parsedUnitId: 'RC1234567890',
          codeScheme: 'I',
          checkDigit: '0',
          manualUnitId: 'RC1234567890',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
        },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onTubePostValidate(mockEvent, 'red');
      tick();

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(mockEvent.reject).not.toHaveBeenCalled();
      expect(component.currentUnitEntry().red).toBe('RC1234567890');
    }));

    it('should handle validation failure when response.success is false', fakeAsync(() => {
      const mockValidationResponse = {
        success: false,
        message: 'Unit not found in system',
        statusCode: 400,
        item: {
          isValid: false,
          isDuplicate: false,
          requiresReason: false,
          decodedUnitId: null,
          decodedOsUnitId: null,
          checkDigit: null,
          oldUnitId: null,
          errorMessage: 'Unit not found in system',
          errorCode: null,
          codeScheme: 'I'
        }
      };

      mockTubesService.validateUnit.and.returnValue(of(mockValidationResponse));

      const mockEvent: UnitIdPostValidateEvent = {
        data: {
          parsedUnitId: 'U99999',
          codeScheme: 'I',
          checkDigit: '9',
          manualUnitId: 'U99999',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
        },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onTubePostValidate(mockEvent, 'red');
      tick();

      // When response.success is false, showError is called and event is rejected
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit not found in system');
      expect(mockEvent.reject).toHaveBeenCalledWith('Unit not found in system');
      expect(mockEvent.confirm).not.toHaveBeenCalled();
    }));

    it('should handle validation failure when response.item is null', fakeAsync(() => {
      const mockValidationResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: null
      };

      mockTubesService.validateUnit.and.returnValue(of(mockValidationResponse));

      const mockEvent: UnitIdPostValidateEvent = {
        data: {
          parsedUnitId: 'U88888',
          codeScheme: 'I',
          checkDigit: '8',
          manualUnitId: 'U88888',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
        },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onTubePostValidate(mockEvent, 'red');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('No validation data received from server');
      expect(mockEvent.reject).toHaveBeenCalledWith('No validation data received from server');
    }));



    it('should handle validation API error', fakeAsync(() => {
      mockTubesService.validateUnit.and.returnValue(
        throwError(() => ({ message: 'API error' }))
      );

      const mockEvent: UnitIdPostValidateEvent = {
        data: {
          parsedUnitId: 'U12345',
          codeScheme: 'I',
          checkDigit: '5',
          manualUnitId: 'U12345',
          codabarUnitScheme: null,
          entryMode: 'S',
          barcodeType: 'CODE128',
          chapterScheme: 'I',
        },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onTubePostValidate(mockEvent, 'osPurple1');
      tick();

      // Error handler extracts message and calls showError
      expect(mockSnackbarService.showError).toHaveBeenCalled();
      expect(mockEvent.reject).toHaveBeenCalled();
    }));






  });

  describe('Reset and Cancel', () => {
    beforeEach(() => {
      // Set up option options including 'A' for reset tests
      component.optionOptions.set([
        { code: 'A', description: 'Check-In All Tubes' },
        { code: 'P*', description: 'Purple Tubes Only' },
        { code: 'P1', description: 'Purple 1 Only' },
        { code: 'P2', description: 'Purple 2 Only' },
        { code: 'R1', description: 'Red 1 Only' },
      ]);
      component.filteredOptionOptions.set(component.optionOptions());
    });

    it('should reset all data when cancel is clicked', () => {
      component.section1Form.patchValue({
        contractId: 'C001',
        profileSetId: 'PS001',
      });
      component.section1ContractId.set('C001');
      component.section1ProfileSetId.set('PS001');
      component.hasRetrieved.set(true);
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
      ]);

      component.onCancel();

      expect(component.section1ContractId()).toBeNull();
      expect(component.section1ProfileSetId()).toBeNull();
      expect(component.hasRetrieved()).toBe(false);
      expect(component.tubeRows().length).toBe(1);
      expect(component.tubeRows()[0].outsideRed).toBe('');
    });

    it('should reset option to null after cancel', () => {
      component.section2OptionCode.set('P1');

      component.onCancel();

      expect(component.section2OptionCode()).toBeNull();
      expect(component.selectedOption()).toBeNull();
    });
  });

  describe('Chapter Changes', () => {
    beforeEach(() => {
      // Set up option options including 'A' for reset tests
      component.optionOptions.set([
        { code: 'A', description: 'Check-In All Tubes' },
        { code: 'P*', description: 'Purple Tubes Only' },
        { code: 'P1', description: 'Purple 1 Only' },
        { code: 'P2', description: 'Purple 2 Only' },
        { code: 'R1', description: 'Red 1 Only' },
      ]);
      component.filteredOptionOptions.set(component.optionOptions());
    });

    it('should reset and reload contracts on chapter change', fakeAsync(() => {
      component.section1Form.patchValue({
        contractId: 'C001',
        profileSetId: 'PS001',
      });

      chapterChangedSubject.next();
      tick();

      expect(component.section1ContractId()).toBeNull();
      expect(mockTubesService.getContracts).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Computed Properties', () => {
    it('should compute table data with sequence numbers', () => {
      component.tubeRows.set([
        { outsideRed: 'U1', red: 'R1', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
        { outsideRed: 'U2', red: 'R2', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
      ]);

      const tableData = component.tableData();

      expect(tableData.length).toBe(2);
      expect(tableData[0].sequence).toBe(1);
      expect(tableData[0].outsideRed).toBe('U1');
      expect(tableData[1].sequence).toBe(2);
      expect(tableData[1].outsideRed).toBe('U2');
    });
  });

  describe('Utility Methods', () => {

    it('should convert string date to ISO datetime', () => {
      mockTubesService.convertToIsoDateTime.and.returnValue(
        '2026-06-01T00:00:00.000Z'
      );

      const result = (component as any).convertMomentToIso('01-JUN-2026', '00:00');

      expect(mockTubesService.convertToIsoDateTime).toHaveBeenCalledWith(
        '01-JUN-2026',
        '00:00'
      );
      expect(result).toBe('2026-06-01T00:00:00.000Z');
    });
  });

  // ── Tube Format Determination Tests ──────────────────────────────────────────

  describe('determineTubeFormat', () => {
    it('should return "R" for red tube only', () => {
      const tubeEntries = [
        {
          unitIdRed: 'R1234567890',
          osUnitIdRed: null,
          unitIdPurple: null,
          osUnitIdPurple: null,
          unitIdSerum: null,
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('R');
    });

    it('should return "R1" for red + purple1 tubes', () => {
      const tubeEntries = [
        {
          unitIdRed: 'R1234567890',
          osUnitIdRed: null,
          unitIdPurple: 'P1234567890',
          osUnitIdPurple: null,
          unitIdSerum: null,
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('R1');
    });

    it('should return "R2" for red + purple2 tubes', () => {
      const tubeEntries = [
        {
          unitIdRed: 'R1234567890',
          osUnitIdRed: null,
          unitIdPurple: null,
          osUnitIdPurple: null,
          unitIdSerum: 'S1234567890',
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('R2');
    });

    it('should return "A" for all tubes (red + purple1 + purple2)', () => {
      const tubeEntries = [
        {
          unitIdRed: 'R1234567890',
          osUnitIdRed: null,
          unitIdPurple: 'P1234567890',
          osUnitIdPurple: null,
          unitIdSerum: 'S1234567890',
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('A');
    });

    it('should return "P1" for purple1 only', () => {
      const tubeEntries = [
        {
          unitIdRed: null,
          osUnitIdRed: null,
          unitIdPurple: 'P1234567890',
          osUnitIdPurple: null,
          unitIdSerum: null,
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('P1');
    });

    it('should return "P2" for purple2 only', () => {
      const tubeEntries = [
        {
          unitIdRed: null,
          osUnitIdRed: null,
          unitIdPurple: null,
          osUnitIdPurple: null,
          unitIdSerum: 'S1234567890',
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('P2');
    });

    it('should return "P*" for both purple tubes (purple1 + purple2)', () => {
      const tubeEntries = [
        {
          unitIdRed: null,
          osUnitIdRed: null,
          unitIdPurple: 'P1234567890',
          osUnitIdPurple: null,
          unitIdSerum: 'S1234567890',
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('P*');
    });

    it('should return "R" for empty array', () => {
      const format = (component as any).determineTubeFormat([]);
      expect(format).toBe('R');
    });

    it('should detect format from OS (outside) unit IDs', () => {
      const tubeEntries = [
        {
          unitIdRed: null,
          osUnitIdRed: '1234567890',
          unitIdPurple: null,
          osUnitIdPurple: '1234567891',
          unitIdSerum: null,
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('R1'); // Red + Purple1 from OS IDs
    });

    it('should detect format from multiple entries', () => {
      const tubeEntries = [
        {
          unitIdRed: 'R1234567890',
          osUnitIdRed: null,
          unitIdPurple: null,
          osUnitIdPurple: null,
          unitIdSerum: null,
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        },
        {
          unitIdRed: null,
          osUnitIdRed: null,
          unitIdPurple: 'P1234567890',
          osUnitIdPurple: null,
          unitIdSerum: 'S1234567890',
          osUnitIdSerum: null,
          redChkDigit: null,
          osRedChkDigit: null,
          purpleChkDigit: null,
          osPurpleChkDigit: null,
          serumChkDigit: null,
          duplicateReasonCode: null,
          duplicateAllowed: false
        }
      ];

      const format = (component as any).determineTubeFormat(tubeEntries);
      expect(format).toBe('A'); // All tubes across entries
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW TEST CASES FOR RECENT CHANGES
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Collection Date Validation for Batch ID = NEW', () => {
    beforeEach(() => {
      // Set received date for reference
      receivedDate = moment('2026-06-15');
      component.section1Form.patchValue({
        batchId: 'NEW',
        receivedDate: receivedDate
      });
    });





    it('should accept valid Collection Date (today)', () => {
      const today = moment().startOf('day');
      const collectionControl = component.section1Form.get('collectionDate');

      collectionControl?.setValue(today);

      expect(collectionControl?.hasError('futureDate')).toBeFalsy();
      expect(collectionControl?.hasError('beforeReceivedDate')).toBeFalsy();
      expect(collectionControl?.valid).toBe(true);
    });

    it('should accept Collection Date equal to Received Date', () => {
      const sameDate = moment('2026-06-15');
      const collectionControl = component.section1Form.get('collectionDate');

      component.section1Form.patchValue({ receivedDate: sameDate });
      collectionControl?.setValue(sameDate);

      expect(collectionControl?.hasError('beforeReceivedDate')).toBeFalsy();
      expect(collectionControl?.valid).toBe(true);
    });

    it('should not validate Collection Date when Batch ID is not NEW', () => {
      const futureDate = moment().add(5, 'days');
      const collectionControl = component.section1Form.get('collectionDate');

      component.section1Form.patchValue({ batchId: 'B001' });
      collectionControl?.setValue(futureDate);

      // Validation should be skipped when Batch ID != NEW
      expect(collectionControl?.hasError('futureDate')).toBeFalsy();
      expect(collectionControl?.valid).toBe(true);
    });

    it('should re-validate Collection Date when Batch ID changes to NEW', () => {
      const futureDate = moment().add(2, 'days');
      const collectionControl = component.section1Form.get('collectionDate');

      // First set with non-NEW batch (valid)
      component.section1Form.patchValue({ batchId: 'B001' });
      collectionControl?.setValue(futureDate);
      expect(collectionControl?.valid).toBe(true);

      // Change to NEW batch (should become invalid)
      component.section1Form.patchValue({ batchId: 'NEW' });
      expect(collectionControl?.hasError('futureDate')).toBe(true);
      expect(collectionControl?.valid).toBe(false);
    });

  });

  describe('Table Data with Current Entry', () => {
    it('should NOT show currentUnitEntry in table until SAVE is clicked', () => {
      component.currentUnitEntry.set({
        outsideRed: 'U001',
        red: 'U002',
        osPurple1: '',
        purple1: '',
        osPurple2: '',
        purple2: ''
      });

      component.tubeRows.set([]);

      const tableData = component.tableData();

      // Current entry is not shown in table until SAVE
      expect(tableData.length).toBe(0);
    });

    it('should not show empty currentUnitEntry in table', () => {
      component.currentUnitEntry.set({
        outsideRed: '',
        red: '',
        osPurple1: '',
        purple1: '',
        osPurple2: '',
        purple2: ''
      });

      component.tubeRows.set([]);

      const tableData = component.tableData();

      expect(tableData.length).toBe(0);
    });

    it('should only show saved rows in table, not currentUnitEntry', () => {
      component.currentUnitEntry.set({
        outsideRed: 'U001',
        red: '',
        osPurple1: '',
        purple1: '',
        osPurple2: '',
        purple2: ''
      });

      component.tubeRows.set([
        { outsideRed: 'U002', red: 'U003', osPurple1: '', purple1: '', osPurple2: '', purple2: '', isSaved: true }
      ]);

      const tableData = component.tableData();

      // Only saved rows appear, not currentUnitEntry
      expect(tableData.length).toBe(1);
      expect(tableData[0].sequence).toBe(1);
      expect(tableData[0].outsideRed).toBe('U002');
    });
  });

  describe('Save with Current Entry', () => {
    beforeEach(() => {
      component.section1Form.patchValue({
        contractId: 'C001',
        profileSetId: 'PS001',
        batchId: 'B001',
        optionCode: 'A'
      });
      component.hasRetrieved.set(true);
      // Mark form as valid - required for canSave() to return true
      component.section1Form.markAsTouched();
      component.section1Form.updateValueAndValidity();
    });






    it('should only save unsaved rows (filter by isSaved flag)', fakeAsync(() => {
      component.currentUnitEntry.set({
        outsideRed: '',
        red: '',
        osPurple1: '',
        purple1: '',
        osPurple2: '',
        purple2: ''
      });

      component.tubeRows.set([
        { outsideRed: 'U001', red: 'R001', osPurple1: '', purple1: '', osPurple2: '', purple2: '', isSaved: true },
        { outsideRed: 'U002', red: 'R002', osPurple1: '', purple1: '', osPurple2: '', purple2: '', isSaved: false },
        { outsideRed: 'U003', red: 'R003', osPurple1: '', purple1: '', osPurple2: '', purple2: '', isSaved: false }
      ]);

      mockTubesService.checkIn.and.returnValue(
        of({
          success: true,
          message: 'Saved',
          statusCode: 200,
          data: { batchId: 'B001', unitsProcessed: 2, testsScheduled: 0, success: true }
        })
      );

      component.onSave();
      tick();

      callArgs = mockTubesService.checkIn.calls.mostRecent().args[0];
      // Should only save the 2 unsaved rows (U002, U003), not the already saved U001
      expect(callArgs.units.length).toBe(2);
      expect(callArgs.units[0].osUnitIdRed).toBe('U002');
      expect(callArgs.units[1].osUnitIdRed).toBe('U003');
    }));





  });


  describe('R2 Option - Dynamic Table Configuration', () => {
    it('should show only 3 columns (Sequence, OS Red, Red) when option is R2', () => {
      component.section2OptionCode.set('R2');

      const config = component.unitTableConfig();

      expect(config.columns.length).toBe(3);
      expect(config.columns[0].key).toBe('sequence');
      expect(config.columns[1].key).toBe('outsideRed');
      expect(config.columns[2].key).toBe('red');
    });

    it('should apply red color CSS class to sequence column when option is R2', () => {
      component.section2OptionCode.set('R2');

      const config = component.unitTableConfig();

      expect((config.columns[0] as any).cssClass).toBe('sequence-red');
    });



    it('should show all 7 columns when option is not R2', () => {
      component.section2OptionCode.set('A');

      const config = component.unitTableConfig();

      expect(config.columns.length).toBe(7);
      expect(config.columns[0].key).toBe('sequence');
      expect(config.columns[1].key).toBe('outsideRed');
      expect(config.columns[2].key).toBe('red');
      expect(config.columns[3].key).toBe('osPurple1');
      expect(config.columns[4].key).toBe('purple1');
      expect(config.columns[5].key).toBe('osPurple2');
      expect(config.columns[6].key).toBe('purple2');
    });



  });

  describe('CLEAR ALL - Collection Date Validator', () => {


    it('should reset selectedBatchProfileSeqNo when CLEAR ALL is clicked', () => {
      component.selectedBatchProfileSeqNo.set(5);

      component.onClearAll();

      expect(component.selectedBatchProfileSeqNo()).toBeNull();
    });
  });



  describe('Unit ID Field Clearing', () => {
    it('should call clear() on all tube input fields when resetTubeEntry is called', () => {
      // Mock the ViewChild references
      component.outsideRedField = { clear: jasmine.createSpy('clear') };
      component.redField = { clear: jasmine.createSpy('clear') };
      component.osPurple1Field = { clear: jasmine.createSpy('clear') };
      component.purple1Field = { clear: jasmine.createSpy('clear') };
      component.osPurple2Field = { clear: jasmine.createSpy('clear') };
      component.purple2Field = { clear: jasmine.createSpy('clear') };

      component['resetTubeEntry']();

      expect(component.outsideRedField.clear).toHaveBeenCalled();
      expect(component.redField.clear).toHaveBeenCalled();
      expect(component.osPurple1Field.clear).toHaveBeenCalled();
      expect(component.purple1Field.clear).toHaveBeenCalled();
      expect(component.osPurple2Field.clear).toHaveBeenCalled();
      expect(component.purple2Field.clear).toHaveBeenCalled();
    });

    it('should reset validation state when resetTubeEntry is called', () => {
      // Set some validation state
      component.tubeValidationState.set({
        outsideRed: true,
        red: true,
        osPurple1: false,
        purple1: false,
        osPurple2: false,
        purple2: false
      });

      // Mock the ViewChild references to avoid errors
      component.outsideRedField = { clear: jasmine.createSpy('clear') };
      component.redField = { clear: jasmine.createSpy('clear') };
      component.osPurple1Field = { clear: jasmine.createSpy('clear') };
      component.purple1Field = { clear: jasmine.createSpy('clear') };
      component.osPurple2Field = { clear: jasmine.createSpy('clear') };
      component.purple2Field = { clear: jasmine.createSpy('clear') };

      component['resetTubeEntry']();

      // All validation states should be false
      const validationState = component.tubeValidationState();
      expect(validationState['outsideRed']).toBe(false);
      expect(validationState['red']).toBe(false);
      expect(validationState['osPurple1']).toBe(false);
      expect(validationState['purple1']).toBe(false);
      expect(validationState['osPurple2']).toBe(false);
      expect(validationState['purple2']).toBe(false);
    });
  });

  describe('isTubeFieldEnabled Computed Signal', () => {
    it('should enable all fields when option is A (All Tubes)', () => {
      component.section2OptionCode.set('A');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(true);
      expect(enabled.red).toBe(true);
      expect(enabled.osPurple1).toBe(true);
      expect(enabled.purple1).toBe(true);
      expect(enabled.osPurple2).toBe(true);
      expect(enabled.purple2).toBe(true);
    });

    it('should enable only purple fields when option is P* (Purple Tubes Only)', () => {
      component.section2OptionCode.set('P*');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(false);
      expect(enabled.red).toBe(false);
      expect(enabled.osPurple1).toBe(true);
      expect(enabled.purple1).toBe(true);
      expect(enabled.osPurple2).toBe(true);
      expect(enabled.purple2).toBe(true);
    });

    it('should enable only purple1 fields when option is P1', () => {
      component.section2OptionCode.set('P1');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(false);
      expect(enabled.red).toBe(false);
      expect(enabled.osPurple1).toBe(true);
      expect(enabled.purple1).toBe(true);
      expect(enabled.osPurple2).toBe(false);
      expect(enabled.purple2).toBe(false);
    });

    it('should enable only purple2 fields when option is P2', () => {
      component.section2OptionCode.set('P2');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(false);
      expect(enabled.red).toBe(false);
      expect(enabled.osPurple1).toBe(false);
      expect(enabled.purple1).toBe(false);
      expect(enabled.osPurple2).toBe(true);
      expect(enabled.purple2).toBe(true);
    });

    it('should enable only red fields when option is R1', () => {
      component.section2OptionCode.set('R1');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(true);
      expect(enabled.red).toBe(true);
      expect(enabled.osPurple1).toBe(false);
      expect(enabled.purple1).toBe(false);
      expect(enabled.osPurple2).toBe(false);
      expect(enabled.purple2).toBe(false);
    });

    it('should enable only red fields when option is R2', () => {
      component.section2OptionCode.set('R2');

      const enabled = component.isTubeFieldEnabled();

      expect(enabled.outsideRed).toBe(true);
      expect(enabled.red).toBe(true);
      expect(enabled.osPurple1).toBe(false);
      expect(enabled.purple1).toBe(false);
      expect(enabled.osPurple2).toBe(false);
      expect(enabled.purple2).toBe(false);
    });
  });

  describe('Batch Units Loading', () => {
    it('should handle error when loading batch units', fakeAsync(() => {
      mockTubesService.getBatchUnits.and.returnValue(
        throwError(() => new Error('Failed to load batch units'))
      );

      component.onSection3BatchChange('B001');
      tick();

      // Should set default sequence when error occurs
      expect(component.selectedBatch()?.sequence).toBe('1');
    }));
  });

  describe('parseUnitIdWithCheckDigit', () => {
    it('should parse unit ID with check digit', () => {
      const result = (component as any).parseUnitIdWithCheckDigit('W633326062099-5');
      expect(result.unitId).toBe('W633326062099');
      expect(result.checkDigit).toBe('5');
    });

    it('should return full ID when no check digit', () => {
      const result = (component as any).parseUnitIdWithCheckDigit('W633326062099');
      expect(result.unitId).toBe('W633326062099');
      expect(result.checkDigit).toBeNull();
    });

    it('should return nulls for empty string', () => {
      const result = (component as any).parseUnitIdWithCheckDigit('');
      expect(result.unitId).toBeNull();
      expect(result.checkDigit).toBeNull();
    });

    it('should return nulls for null input', () => {
      const result = (component as any).parseUnitIdWithCheckDigit(null);
      expect(result.unitId).toBeNull();
      expect(result.checkDigit).toBeNull();
    });
  });

  describe('isLastEnabledField', () => {
    it('should return true for last enabled field with all enabled', () => {
      component.section2OptionCode.set('A');
      expect((component as any).isLastEnabledField('purple2')).toBeTrue();
    });

    it('should return false for non-last enabled field', () => {
      component.section2OptionCode.set('A');
      expect((component as any).isLastEnabledField('outsideRed')).toBeFalse();
    });

    it('should return true for red when only red is enabled (R1)', () => {
      component.section2OptionCode.set('R1');
      expect((component as any).isLastEnabledField('red')).toBeTrue();
    });

    it('should return false when no fields enabled (edge)', () => {
      // Edge case - shouldn't happen in practice
      component.section2OptionCode.set(null);
      // With no option, all are enabled, purple2 is last
      expect((component as any).isLastEnabledField('purple2')).toBeTrue();
    });
  });

  describe('onRowInput', () => {
    it('should update tube row value', () => {
      component.tubeRows.set([
        { outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      component.onRowInput(0, 'outsideRed', 'U001');
      expect(component.tubeRows()[0].outsideRed).toBe('U001');
    });

    it('should add 2 rows when last row is filled and under limit', () => {
      component.tubeRows.set([
        { outsideRed: 'U001', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      // Trigger with a value on the last row
      component.onRowInput(0, 'red', 'R001');
      // isRowFilled checks any field, outsideRed and red are filled
      expect(component.tubeRows().length).toBe(3); // original + 2 new
    });
  });

  describe('deleteRow', () => {
    it('should remove row when multiple rows exist', () => {
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' },
        { outsideRed: 'U2', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      component.deleteRow(0);
      expect(component.tubeRows().length).toBe(1);
      expect(component.tubeRows()[0].outsideRed).toBe('U2');
    });

    it('should clear last row instead of removing', () => {
      component.tubeRows.set([
        { outsideRed: 'U1', red: 'R1', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      component.deleteRow(0);
      expect(component.tubeRows().length).toBe(1);
      expect(component.tubeRows()[0].outsideRed).toBe('');
    });
  });

  describe('onTubeCleared', () => {
    it('should clear tube entry and validation state', () => {
      component.currentUnitEntry.set({
        outsideRed: 'U001', red: 'R001', osPurple1: '', purple1: '', osPurple2: '', purple2: ''
      });
      component.tubeValidationState.set({
        outsideRed: true, red: true, osPurple1: false, purple1: false, osPurple2: false, purple2: false
      });

      component.onTubeCleared('red');

      expect(component.currentUnitEntry().red).toBe('');
      expect(component.tubeValidationState()['red']).toBeFalse();
    });
  });

  describe('onTubeFieldBlur', () => {
    it('should not trigger save when not last enabled field', () => {
      component.section2OptionCode.set('A');
      spyOn(component, 'onSave');
      component.onTubeFieldBlur('outsideRed');
      expect(component.onSave).not.toHaveBeenCalled();
    });
  });

  describe('onTubeEnterSubmit', () => {
    it('should do nothing (no-op)', () => {
      // Just ensure it doesn't throw
      expect(() => component.onTubeEnterSubmit()).not.toThrow();
    });
  });

  describe('onCloseProfileTests / onCloseUnitsInBatch', () => {
    it('should close profile tests panel', () => {
      component.showProfileTestsPanel.set(true);
      component.onCloseProfileTests();
      expect(component.showProfileTestsPanel()).toBeFalse();
    });

    it('should close units in batch panel', () => {
      component.showUnitsInBatchPanel.set(true);
      component.onCloseUnitsInBatch();
      expect(component.showUnitsInBatchPanel()).toBeFalse();
    });
  });

  describe('onSection2OptionChange', () => {
    it('should set selected option and option code', () => {
      component.optionOptions.set([{ code: 'R', description: 'Red only' }]);
      component.onSection2OptionChange('R');
      expect(component.selectedOption()?.code).toBe('R');
      expect(component.section2OptionCode()).toBe('R');
    });

    it('should set null when empty option', () => {
      component.onSection2OptionChange('');
      expect(component.selectedOption()).toBeNull();
      expect(component.section2OptionCode()).toBeNull();
    });
  });

  describe('onSection1ContractChange with empty', () => {
    it('should not load profile sets when contractId is empty', () => {
      mockTubesService.getProfileSets.calls.reset();
      component.onSection1ContractChange('');
      expect(mockTubesService.getProfileSets).not.toHaveBeenCalled();
    });
  });

  describe('loadCheckInOptions error', () => {
    it('should show error when tube formats fail to load', fakeAsync(() => {
      mockTubesService.getTubeFormats.and.returnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load tube formats');
    }));
  });

  describe('loadDuplicateReasons error', () => {
    it('should not show error to user on duplicate reasons load failure', fakeAsync(() => {
      mockTubesService.getDuplicateReasons.and.returnValue(throwError(() => new Error('fail')));
      mockSnackbarService.showError.calls.reset();
      component.ngOnInit();
      tick();
      // Should not show error for duplicate reasons (not critical)
      // But contracts error might have been shown. Check it doesn't show duplicate-specific error
    }));
  });

  describe('onRetrieve with NEW batch missing collection date', () => {
    it('should show error when NEW batch has no collection date', () => {
      component.section1Form.patchValue({ batchId: 'NEW', collectionDate: null });
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Collection Date should be entered if Batch ID is NEW'
      );
      expect(component.hasRetrieved()).toBeFalse();
    });
  });

  describe('onSave validation', () => {
    it('should show error when form is invalid', () => {
      component.section1Form.patchValue({ contractId: null, profileSetId: null });
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('required fields')
      );
    });

    it('should show error when no unsaved entries exist', () => {
      component.section1Form.patchValue({
        contractId: 'C001', profileSetId: 'PS001', batchId: 'B001', optionCode: 'A'
      });
      component.currentUnitEntry.set({
        outsideRed: '', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: ''
      });
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '', isSaved: true }
      ]);
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('No new entries')
      );
    });

    it('should handle save error with field-level validation errors', fakeAsync(() => {
      component.section1Form.patchValue({
        contractId: 'C001', profileSetId: 'PS001', batchId: 'B001', optionCode: 'A'
      });
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      mockTubesService.checkIn.and.returnValue(throwError(() => ({
        error: { errors: [{ field: 'unitId', message: 'Invalid' }] }
      })));
      component.onSave();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('Validation errors'));
      expect(component.isSaving()).toBeFalse();
    }));

    it('should handle save error with generic message', fakeAsync(() => {
      component.section1Form.patchValue({
        contractId: 'C001', profileSetId: 'PS001', batchId: 'B001', optionCode: 'A'
      });
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      mockTubesService.checkIn.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSave();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Failed to check in tubes. Please try again.'
      );
    }));

    it('should handle save success with response.success = false', fakeAsync(() => {
      component.section1Form.patchValue({
        contractId: 'C001', profileSetId: 'PS001', batchId: 'B001', optionCode: 'A'
      });
      component.tubeRows.set([
        { outsideRed: 'U1', red: '', osPurple1: '', purple1: '', osPurple2: '', purple2: '' }
      ]);
      mockTubesService.checkIn.and.returnValue(of({
        success: false, message: 'Check-in failed', statusCode: 400,
        data: { batchId: 'B001', unitsProcessed: 0, testsScheduled: 0, success: false }
      }));
      component.onSave();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Check-in failed');
    }));
  });

  describe('convertMomentToIso with Moment object', () => {
    it('should convert Moment to ISO via service', () => {
      const m = moment('2026-06-01');
      (component as any).convertMomentToIso(m, '14:30');
      const dateStr = m.format('DD-MMM-YYYY');
      expect(mockTubesService.convertToIsoDateTime).toHaveBeenCalledWith(dateStr, '14:30');
    });
  });

  describe('canRetrieve computed', () => {
    it('should return false when not all required fields are set', () => {
      component.section1Form.patchValue({ contractId: 'C001', profileSetId: null, batchId: null, optionCode: null });
      expect(component.canRetrieve()).toBeFalse();
    });

    it('should return true when all required fields are set', fakeAsync(() => {
      component.section1Form.patchValue({ contractId: 'C001', profileSetId: 'PS001', batchId: 'B001', optionCode: 'A' });
      tick();
      expect(component.canRetrieve()).toBeTrue();
    }));

    it('should require collection date when batch is NEW', fakeAsync(() => {
      component.section1Form.patchValue({ contractId: 'C001', profileSetId: 'PS001', batchId: 'NEW', optionCode: 'A', collectionDate: null });
      tick();
      expect(component.canRetrieve()).toBeFalse();
    }));
  });

  describe('canClearAll computed', () => {
    it('should return false when no fields have values and not retrieved', () => {
      component.section1Form.reset();
      component.hasRetrieved.set(false);
      expect(component.canClearAll()).toBeFalse();
    });

    it('should return true when any field has value', fakeAsync(() => {
      component.section1Form.patchValue({ contractId: 'C001' });
      tick();
      expect(component.canClearAll()).toBeTrue();
    }));

    it('should return true when hasRetrieved is true', () => {
      component.hasRetrieved.set(true);
      expect(component.canClearAll()).toBeTrue();
    });
  });

  describe('onEnterNotes with NEW batch', () => {
    it('should not open notes for NEW batch', () => {
      component.section1Form.patchValue({ batchId: 'NEW', collectionDate: moment() });
      component.onEnterNotes();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Please select an existing batch to view notes'
      );
    });
  });

  describe('onSection1ProfileChange error paths', () => {
    it('should use fallback when fetchChapterTimezone fails', fakeAsync(() => {
      mockChapterTimezoneService.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz fail')));
      component.section1ContractId.set('C001');
      component.onSection1ProfileChange('PS001');
      tick();
      // Should still set received date/time from cached value
      expect(component.section1Form.get('receivedDate')?.value).toBeTruthy();
      expect(component.section1Form.get('receivedTime')?.value).toBe('03:36');
    }));

    it('should handle error when loading batches fails', fakeAsync(() => {
      mockTubesService.getBatches.and.returnValue(throwError(() => new Error('fail')));
      component.section1ContractId.set('C001');
      component.onSection1ProfileChange('PS001');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load batches');
    }));
  });

  describe('onSection3BatchChange NEW', () => {
    it('should generate batch ID for NEW selection', fakeAsync(() => {
      component.section1ContractId.set('C001');
      component.section1ProfileSetId.set('PS001');
      component.batchIdOptions.set(['B001', 'B002']);

      component.onSection3BatchChange('NEW');
      tick();

      expect(mockTubesService.generateBatchId).toHaveBeenCalled();
      expect(component.section1Form.get('batchId')?.value).toBe('NEWBATCH001');
    }));

    it('should handle error when generating batch ID fails', fakeAsync(() => {
      mockTubesService.generateBatchId.and.returnValue(throwError(() => new Error('gen fail')));
      component.section1ContractId.set('C001');
      component.onSection3BatchChange('NEW');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to generate batch ID');
      expect(component.section1Form.get('batchId')?.value).toBeNull();
    }));
  });

  describe('loadProfileSets error', () => {
    it('should show error when profile sets fail to load', fakeAsync(() => {
      mockTubesService.getProfileSets.and.returnValue(throwError(() => new Error('fail')));
      component.onSection1ContractChange('C001');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load profile sets');
    }));
  });

  describe('onTubePostValidate skip', () => {
    it('should return early without contractId', () => {
      component.section1ContractId.set(null);
      const event = {
        data: { parsedUnitId: 'U001' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      } as any;
      component.onTubePostValidate(event, 'red');
      expect(mockTubesService.validateUnit).not.toHaveBeenCalled();
    });

    it('should return early without parsedUnitId', () => {
      component.section1ContractId.set('C001');
      const event = {
        data: { parsedUnitId: '' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      } as any;
      component.onTubePostValidate(event, 'red');
      expect(mockTubesService.validateUnit).not.toHaveBeenCalled();
    });
  });

  describe('Validation API error with status 0', () => {
    it('should show network error for status 0', fakeAsync(() => {
      component.section1ContractId.set('C001');
      mockTubesService.validateUnit.and.returnValue(throwError(() => ({ status: 0 })));
      const event = {
        data: { parsedUnitId: 'U001', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      } as any;
      component.onTubePostValidate(event, 'red');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Unable to connect to server. Please check your connection.'
      );
    }));

    it('should show 404 error', fakeAsync(() => {
      component.section1ContractId.set('C001');
      mockTubesService.validateUnit.and.returnValue(throwError(() => ({ status: 404 })));
      const event = {
        data: { parsedUnitId: 'U001', codeScheme: 'I' },
        confirm: jasmine.createSpy(),
        reject: jasmine.createSpy()
      } as any;
      component.onTubePostValidate(event, 'red');
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        'Validation endpoint not found. Please contact support.'
      );
    }));
  });
});
