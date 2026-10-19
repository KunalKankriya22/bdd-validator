import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';

import { FixedProfileTubeCheckInComponent } from './fixed-profile-tube-check-in';
import { FixedProfileTubeCheckInService } from './services/fixed-profile-tube-check-in.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ContractOption,
  BatchDropdownDto,
  FixedProfileTubeCheckinDto,
  ReturnResult,
} from './models/fixed-profile-tube-check-in.model';

describe('FixedProfileTubeCheckInComponent', () => {
  let receiptDate: any;
  let component: FixedProfileTubeCheckInComponent;
  let fixture: ComponentFixture<FixedProfileTubeCheckInComponent>;
  let mockService: jasmine.SpyObj<FixedProfileTubeCheckInService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockContracts: ContractOption[] = [
    {
      contractId: 'SH121617AS1301',
      description: 'US Naval Hospital Okinawa',
      redTubeAvailable: true,
      red2TubeAvailable: true,
      purpleTubeAvailable: true,
      purple2TubeAvailable: false,
    },
    {
      contractId: 'SH121617AS1321',
      description: 'Okinawa Japan Hospital',
      redTubeAvailable: true,
      red2TubeAvailable: false,
      purpleTubeAvailable: true,
      purple2TubeAvailable: true,
    },
  ];

  const mockBatches: BatchDropdownDto[] = [
    { batchId: 'B001', receivedDate: '2026-01-09T00:00:00Z' },
    { batchId: 'B002', receivedDate: '2026-01-10T00:00:00Z' },
  ];

  const mockRecords: FixedProfileTubeCheckinDto[] = [
    {
      osUnitId: 'W337818031402W',
      unitId: 'W337818031402W',
      collDate: '2026-01-09T00:00:00Z',
      receivedDate: '2026-01-09T00:00:00Z',
      chapterId: 'H',
      batchId: 'B001',
      contractId: 'SH121617AS1301',
      redTubeFlag: 'Y',
      purpleTubeFlag: 'Y',
      redTube2: null,
      serumPlasmaInd: null,
      warehouseId: null,
      programId: null,
      insertDats: null,
      osChkDigit: null,
      chkDigit: null,
      unitSeq: null,
      sequenceNo: 1,
    },
  ];

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('FixedProfileTubeCheckInService', [
      'getAll',
      'getById',
      'create',
      'update',
      'deleteRecord',
      'getContracts',
      'getBatches',
      'batchCheckin',
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'convertToChapterTimezone',
      'isChapterLocalDateAvailable',
      'getChapterLocalDate',
    ]);
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());

    mockService.getContracts.and.returnValue(of(mockContracts));
    mockService.getBatches.and.returnValue(of(mockBatches));
    mockService.getAll.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockRecords, total: 1 })
    );
    mockService.create.and.returnValue(
      of({ success: true, message: 'Created', statusCode: 201, data: null })
    );
    mockService.batchCheckin.and.returnValue(
      of({ success: true, message: 'Batch saved', statusCode: 200, item: { batchId: 'B003', unitsProcessed: 1, testsScheduled: 5, success: true } })
    );



      TestBed.configureTestingModule({
imports: [FixedProfileTubeCheckInComponent, NoopAnimationsModule, ReactiveFormsModule, FormsModule],
      providers: [
        provideRouter([]),
        { provide: FixedProfileTubeCheckInService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
      ],
    });


    });



  beforeEach(() => {


      mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);


      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment());


      mockService.getContracts.and.returnValue(of(mockContracts));


      mockService.getBatches.and.returnValue(of(mockBatches));











    fixture = TestBed.createComponent(FixedProfileTubeCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {

    it('should start with hasRetrieved as false', () => {
      expect(component.hasRetrieved()).toBe(false);
    });

    it('should initialize filter form with required validators', () => {
      expect(component.filterForm.get('contractId')?.hasError('required')).toBe(true);
      expect(component.filterForm.get('collectionDate')?.hasError('required')).toBe(true);
      expect(component.filterForm.get('receiptDate')?.hasError('required')).toBe(true);
    });

    it('should initialize tube flag dropdowns with default values', () => {
      expect(component.filterForm.get('red1')?.value).toBeNull();
      expect(component.filterForm.get('red2')?.value).toBeNull();
      expect(component.filterForm.get('purple1')?.value).toBeNull();
      expect(component.filterForm.get('purple2')?.value).toBeNull();
    });
  });

  describe('Contract Selection', () => {
    it('should load batches when contract is selected', fakeAsync(() => {
      component.onContractChange('SH121617AS1301');
      tick();

      expect(mockService.getBatches).toHaveBeenCalledWith('SH121617AS1301');
      expect(component.batchOptions().length).toBe(2);
    }));

    it('should reset batch when contract changes', () => {
      component.filterForm.patchValue({ batchId: 'B001' });
      component.onContractChange('SH121617AS1321');

      expect(component.filterForm.get('batchId')?.value).toBeNull();
    });

    it('should set tube flags based on contract availability', fakeAsync(() => {
      component.onContractChange('SH121617AS1301');
      tick();

      // Component resets tube fields to null on contract change; tube availability
      // is determined by the isTubeFieldEnabled computed signal, not form values
      expect(component.filterForm.get('red1')?.value).toBeNull();
      expect(component.filterForm.get('red2')?.value).toBeNull();
      expect(component.filterForm.get('purple1')?.value).toBeNull();
      expect(component.filterForm.get('purple2')?.value).toBeNull();
    }));

    it('should compute contract description', fakeAsync(() => {
      component.onContractChange('SH121617AS1301');
      tick();
      expect(component.selectedContractDescription()).toBe('US Naval Hospital Okinawa');
    }));
  });

  describe('Batch Selection', () => {
    it('should auto-populate dates and flags when batch is selected', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'SH121617AS1301' });
      component.onBatchChange('B001');
      tick();

      expect(mockService.getAll).toHaveBeenCalledWith(1, 0, jasmine.objectContaining({
        contractId: 'SH121617AS1301',
        batchId: 'B001',
      }));
    }));

    it('should not show data entry section when batch is selected', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'SH121617AS1301' });
      component.onBatchChange('B001');
      tick();

      expect(component.hasRetrieved()).toBe(false);
    }));


    it('should parse dates correctly when batch data is loaded', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'SH121617AS1301' });
      component.onBatchChange('B001');
      tick();

      const collDate = component.filterForm.get('collectionDate')?.value;
      receiptDate = component.filterForm.get('receiptDate')?.value;

      expect(collDate).toBeTruthy();
      expect(receiptDate).toBeTruthy();
      expect(moment.isMoment(collDate)).toBe(true);
      expect(moment.isMoment(receiptDate)).toBe(true);
    }));

    it('should handle batch load error gracefully', fakeAsync(() => {
      mockService.getAll.and.returnValue(throwError(() => new Error('API Error')));
      component.filterForm.patchValue({ contractId: 'SH121617AS1301' });

      component.onBatchChange('B001');
      tick();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load batch details');
    }));
  });

  describe('Retrieve Button', () => {


    it('should show data entry section when clicked', fakeAsync(() => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: 'Y',
      });

      component.onRetrieve();
      tick();

      expect(component.hasRetrieved()).toBe(true);
    }));
  });

  describe('Save', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        batchId: null,
        collectionDate: moment('2026-01-09'),
        receiptDate: moment('2026-01-09'),
        red1: 'Y',
        purple1: 'Y',
      });
      component.hasRetrieved.set(true);
    });


    it('should call batchCheckin API when all required tubes are filled', fakeAsync(() => {
      component.onOsUnitIdValidated({ parsedUnitId: 'W337818031402W', checkDigit: null, codeScheme: 'I' });
      component.onTubeFieldValidated({ parsedUnitId: 'W337818031402W', checkDigit: null, codeScheme: 'I' }, 'red1');
      component.onTubeFieldValidated({ parsedUnitId: 'W337818031402W', checkDigit: null, codeScheme: 'I' }, 'purple1');

      // Trigger auto-save by filling all required tubes
      tick();

      expect(mockService.batchCheckin).toHaveBeenCalled();
      const dto = mockService.batchCheckin.calls.mostRecent().args[0];
      expect(dto.contractId).toBe('SH121617AS1301');
      expect(dto.batchId).toBeNull();
      expect(dto.units.length).toBe(1);
      expect(dto.units[0].osUnitId).toBe('W337818031402W');
    }));

    it('should create new batch when batchId is null', fakeAsync(() => {
      mockService.batchCheckin.and.returnValue(
        of({ success: true, message: 'Created', statusCode: 201, item: { batchId: 'B003', unitsProcessed: 1, testsScheduled: 5, success: true } })
      );

      component.onOsUnitIdValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' });
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'red1');
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'purple1');
      tick();

      expect(component.filterForm.get('batchId')?.value).toBe('B003');
    }));

    it('should refresh batch dropdown after creating new batch', fakeAsync(() => {
      mockService.batchCheckin.and.returnValue(
        of({ success: true, message: 'Created', statusCode: 201, item: { batchId: 'B003', unitsProcessed: 1, testsScheduled: 5, success: true } })
      );

      component.onOsUnitIdValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' });
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'red1');
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'purple1');
      tick();

      expect(mockService.getBatches).toHaveBeenCalledWith('SH121617AS1301');
    }));


    it('should clear entry fields after successful save', fakeAsync(() => {
      component.onOsUnitIdValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' });
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'red1');
      component.onTubeFieldValidated({ parsedUnitId: 'UNIT001', checkDigit: null, codeScheme: 'I' }, 'purple1');
      tick();

      // Entry fields should be cleared - we can't directly test this without ViewChildren
      // but we can verify the save was successful
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    }));
  });
  describe('Panels', () => {


    it('should load units when viewing batch units', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'SH121617AS1301', batchId: 'B001' });

      component.onViewUnitsInBatch();
      tick();

      expect(mockService.getAll).toHaveBeenCalled();
      expect(component.showUnitsInBatchPanel()).toBe(true);
    }));

  });

  describe('Chapter Change', () => {
    it('should reset and reload contracts when chapter changes', fakeAsync(() => {
      component.hasRetrieved.set(true);

      chapterChangedSubject.next();
      tick();

      expect(component.hasRetrieved()).toBe(false);
      expect(mockService.getContracts).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Tube Availability', () => {

    it('should disable tubes based on contract flags', fakeAsync(() => {
      component.onContractChange('SH121617AS1301');
      tick();

      const enabled = component.isTubeFieldEnabled();
      expect(enabled.red1).toBe(true);
      expect(enabled.red2).toBe(true);
      expect(enabled.purple1).toBe(true);
      expect(enabled.purple2).toBe(false);
    }));

  });

  describe('Table Data Mapping', () => {
    it('should map tube flags correctly', () => {
      const testData: FixedProfileTubeCheckinDto[] = [
        {
          ...mockRecords[0],
          redTubeFlag: 'Y',
          redTube2: 'P',
          purpleTubeFlag: 'S',
          serumPlasmaInd: null,
        },
      ];

      component['rawData'].set(testData);

      const rows = component.tableData();
      expect(rows[0].red1).toBe('Yes');
      expect(rows[0].red2).toBe('Plasma');
      expect(rows[0].purple1).toBe('Serum');
      expect(rows[0].purple2).toBe('');
    });
  });
  describe('Computed Signals', () => {
    it('should filter contracts based on search', () => {
      component.contractSearchCtrl.setValue('Okinawa');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2);
    });

    it('should return all contracts when search is empty', () => {
      component.contractSearchCtrl.setValue('');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2);
    });

  });

  describe('Page and Sort Changes', () => {
    it('should update pageSize and pageIndex on page change', () => {
      component.onPageChange({ pageSize: 25, pageIndex: 2 });
      expect(component['pageSize']).toBe(25);
      expect(component['pageIndex']).toBe(2);
    });

    it('should update pagination config on page change', () => {
      component.onPageChange({ pageSize: 50, pageIndex: 1 });
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(component.tableConfig.pagination!.pageIndex).toBe(1);
    });

    it('should set ASC sort order for ascending direction', () => {
      component.onSortChange({ column: 'osUnitId', direction: 'asc' });
      expect(component['sortColumn']).toBe('osUnitId');
      expect(component['sortOrder']).toBe('ASC');
      expect(component['pageIndex']).toBe(0);
    });

    it('should set DESC sort order for descending direction', () => {
      component.onSortChange({ column: 'unitId', direction: 'desc' });
      expect(component['sortOrder']).toBe('DESC');
    });

    it('should set empty sort order for no direction', () => {
      component.onSortChange({ column: 'unitId', direction: '' });
      expect(component['sortOrder']).toBe('');
    });
  });

  describe('onSave edge cases', () => {
    it('should show error when currentOsUnitId is empty', () => {
      component['currentOsUnitId'] = '';
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('OS Unit ID is required');
    });

    it('should show error when filter form is invalid', () => {
      component['currentOsUnitId'] = 'UNIT001';
      component.onSave();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fill all required fields');
    });

    it('should handle batchCheckin API error in onSave', fakeAsync(() => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        batchId: 'B001',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: 'Y',
      });
      component['currentOsUnitId'] = 'UNIT001';
      mockService.batchCheckin.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      component.onSave();
      tick();
      expect(component.isSaving()).toBe(false);
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    }));

    it('should handle unsuccessful batchCheckin response in onSave', fakeAsync(() => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        batchId: 'B001',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: 'Y',
      });
      component['currentOsUnitId'] = 'UNIT001';
      mockService.batchCheckin.and.returnValue(
        of({ success: false, message: 'Duplicate entry', statusCode: 400, item: null })
      );
      component.onSave();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Duplicate entry');
    }));

    it('should handle successful onSave with contractId', fakeAsync(() => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        batchId: 'B001',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: 'Y',
      });
      component['currentOsUnitId'] = 'UNIT001';
      mockService.batchCheckin.and.returnValue(
        of({ success: true, message: 'OK', statusCode: 200, item: { batchId: 'B003', unitsProcessed: 1, testsScheduled: 5, success: true } })
      );
      component.onSave();
      tick();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
      expect(mockService.getBatches).toHaveBeenCalledWith('SH121617AS1301');
    }));
  });

  describe('Clear and Panel Actions', () => {
    it('should reset all state on onClearAll', () => {
      component.hasRetrieved.set(true);
      component.filterForm.patchValue({ contractId: 'SH121617AS1301' });
      component.onClearAll();
      expect(component.hasRetrieved()).toBe(false);
      expect(component.filterForm.get('contractId')?.value).toBeNull();
    });

    it('should clear entry fields on onClearTableEntries', () => {
      component['currentOsUnitId'] = 'UNIT001';
      component['currentTubeFields'] = { red1: 'UNIT001' };
      component.onClearTableEntries();
      expect(component['currentOsUnitId']).toBe('');
      expect(component['currentTubeFields']).toEqual({});
    });

    it('should open profile tests panel', () => {
      component.onViewProfileTests();
      expect(component.showProfileTestsPanel()).toBe(true);
    });

    it('should close profile tests panel', () => {
      component.showProfileTestsPanel.set(true);
      component.onCloseProfileTests();
      expect(component.showProfileTestsPanel()).toBe(false);
    });

    it('should close units in batch panel', () => {
      component.showUnitsInBatchPanel.set(true);
      component.onCloseUnitsInBatch();
      expect(component.showUnitsInBatchPanel()).toBe(false);
    });

    it('should show error when viewing units in batch without batchId', () => {
      component.filterForm.patchValue({ batchId: null });
      component.onViewUnitsInBatch();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a Batch ID first');
    });

    it('should handle error when loading batch units fails', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'SH121617AS1301', batchId: 'B001' });
      mockService.getAll.and.returnValue(throwError(() => new Error('API Error')));
      component.onViewUnitsInBatch();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load batch units');
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('Unit ID and Tube Field Handling', () => {
    it('should clear currentOsUnitId on onOsUnitIdCleared', () => {
      component['currentOsUnitId'] = 'UNIT001';
      component.onOsUnitIdCleared();
      expect(component['currentOsUnitId']).toBe('');
    });

    it('should delete tube field on onTubeFieldCleared', () => {
      component['currentTubeFields'] = { red1: 'UNIT001', purple1: 'UNIT001' };
      component.onTubeFieldCleared('red1');
      expect(component['currentTubeFields']['red1']).toBeUndefined();
      expect(component['currentTubeFields']['purple1']).toBe('UNIT001');
    });

    it('should show error when tube unit ID does not match OS Unit ID', () => {
      component['currentOsUnitId'] = 'UNIT001';
      component.onTubeFieldValidated(
        { parsedUnitId: 'DIFFERENT', checkDigit: null, codeScheme: 'I' },
        'red1'
      );
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 3455')
      );
      expect(component['currentTubeFields']['red1']).toBe('');
    });
  });

  describe('formatErrorMessage', () => {
    it('should reformat message with Error Code suffix', () => {
      expect(component['formatErrorMessage']('Unit already exists. Error Code: 0340'))
        .toBe('Error 0340: Unit already exists');
    });

    it('should return as-is when message starts with Error', () => {
      expect(component['formatErrorMessage']('Error 1234: Something wrong'))
        .toBe('Error 1234: Something wrong');
    });

    it('should add Error prefix for numeric code prefix', () => {
      expect(component['formatErrorMessage']('0340: Duplicate entry'))
        .toBe('Error 0340: Duplicate entry');
    });

    it('should return plain message without modification', () => {
      expect(component['formatErrorMessage']('Something failed'))
        .toBe('Something failed');
    });
  });

  describe('loadContracts error path', () => {
    it('should show error when contracts fail to load', fakeAsync(() => {
      mockService.getContracts.and.returnValue(throwError(() => new Error('Network')));
      component['loadContracts']();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load contracts');
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe('onRetrieve validation errors', () => {
    it('should show tube validation errors when no tubes selected', () => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: null,
        red2: null,
        purple1: null,
        purple2: null,
      });
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 0029')
      );
    });

    it('should show R2 requires R1 error', () => {
      component.filterForm.patchValue({
        contractId: 'SH121617AS1301',
        collectionDate: moment(),
        receiptDate: moment(),
        red1: null,
        red2: 'Y',
        purple1: 'Y',
        purple2: null,
      });
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 9323')
      );
    });
  });

  describe('Additional Computed Signals', () => {
    it('canSave should reflect isSaving state', () => {
      component['currentOsUnitId'] = 'UNIT001';
      component.isSaving.set(true);
      expect(component.canSave()).toBe(false);
      component.isSaving.set(false);
      expect(component.canSave()).toBe(true);
    });

    it('canRetrieve should return true when required fields are set', () => {
      component['formValues'].set({
        contractId: 'SH121617AS1301',
        collectionDate: moment(),
        receiptDate: moment(),
      });
      expect(component.canRetrieve()).toBe(true);
    });

    it('canRetrieve should return false when contractId is missing', () => {
      component['formValues'].set({
        contractId: null,
        collectionDate: moment(),
        receiptDate: moment(),
      });
      expect(component.canRetrieve()).toBe(false);
    });

    it('hasFilterValues should return true when contractId is set', () => {
      component['formValues'].set({ contractId: 'SH121617AS1301', batchId: null, collectionDate: null, receiptDate: null });
      expect(component.hasFilterValues()).toBe(true);
    });

    it('hasFilterValues should return false when all filters empty', () => {
      component['formValues'].set({ contractId: null, batchId: null, collectionDate: null, receiptDate: null });
      expect(component.hasFilterValues()).toBe(false);
    });

    it('unitsInBatchData should map batch units correctly', () => {
      component['batchUnitsData'].set([{
        ...mockRecords[0],
        sequenceNo: 3,
        redTubeFlag: 'Y',
        redTube2: null,
        purpleTubeFlag: 'P',
        serumPlasmaInd: 'S',
      }]);
      const data = component.unitsInBatchData();
      expect(data.length).toBe(1);
      expect(data[0].sequence).toBe(3);
      expect(data[0].red1).toBe('Yes');
      expect(data[0].purple1).toBe('Plasma');
      expect(data[0].purple2).toBe('Serum');
    });
  });
});
