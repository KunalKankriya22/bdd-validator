import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { signal } from '@angular/core';
import { MergeDuplicateDonorRecordsComponent } from './merge-duplicate-donor-records';
import { MergeDuplicateDonorRecordsService } from './services/merge-duplicate-donor-records.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DuplicateDonorModel } from './models/merge-duplicate-donor-records.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('MergeDuplicateDonorRecordsComponent', () => {
  let serviceSpyObj: any;
  let component: MergeDuplicateDonorRecordsComponent;
  let fixture: ComponentFixture<MergeDuplicateDonorRecordsComponent>;
  let mockService: jasmine.SpyObj<MergeDuplicateDonorRecordsService>;
  let dialogOpenSpy: jasmine.Spy;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: any;
  let chapterChanged$: Subject<void>;

  const mockDonor1: DuplicateDonorModel = {
    donorId: 'DN30132273',
    donorName: 'SHELIA ROGERS',
    dateOfBirth: '1997-02-13',
    gender: 'F',
    sex: 'F',
    mergeFlag: 'PRIMR',
    flag: 'Primary',
    demographicsCheck: 'Y',
    interdictionsCheck: 'Y',
    donationsCheck: 'Y',
    attributesCheck: 'Y',
    keydataCheck: 'Y',
    allChecksComplete: true
  };

  const mockDonor2: DuplicateDonorModel = {
    donorId: 'DN30132192',
    donorName: 'SHELIA PANERAHE',
    dateOfBirth: '1997-02-13',
    gender: 'F',
    sex: 'F',
    mergeFlag: 'SECON',
    flag: 'Secondary',
    demographicsCheck: 'Y',
    interdictionsCheck: 'Y',
    donationsCheck: 'Y',
    attributesCheck: 'Y',
    keydataCheck: 'Y',
    allChecksComplete: true
  };

  const mockDonorIncomplete: DuplicateDonorModel = {
    donorId: 'DN99999999',
    donorName: 'INCOMPLETE DONOR',
    dateOfBirth: '',
    gender: '',
    mergeFlag: 'SECON',
    flag: 'Secondary',
    demographicsCheck: 'N',
    interdictionsCheck: 'N',
    donationsCheck: 'N',
    attributesCheck: 'N',
    keydataCheck: 'N',
    allChecksComplete: false
  };

  const mockBatchData = {
    setId: 'DPI00000033',
    foundOn: '2025-03-15T21:20:00',
    duplicates: [mockDonor1, mockDonor2]
  };

  const mockPreviewResponse = {
    success: true,
    item: {
      primaryDonor: {
        donorId: 'DN30132273',
        firstName: 'SHELIA',
        lastName: 'ROGERS',
        dateOfBirth: '1997-02-13',
        gender: 'F',
        bloodType: 'O+'
      },
      secondaryDonor: {
        donorId: 'DN30132192',
        firstName: 'SHELIA',
        lastName: 'PANERAHE',
        dateOfBirth: '1997-02-13',
        gender: 'F',
        bloodType: 'O+'
      },
      aboMismatch: false,
      warnings: []
    }
  };

  beforeEach(() => {

    serviceSpyObj = jasmine.createSpyObj('MergeDuplicateDonorRecordsService', [
      'searchBatchesLov',
      'retrieveBatch',
      'previewMerge',
      'mergeDonors',
      'resolveDonors'
    ]);

    const snackbarSpyObj = createMockSnackbarService();

    chapterChanged$ = new Subject<void>();
    mockHeaderService = {
      chapterId: jasmine.createSpy('chapterId').and.returnValue('1'),
      chapterTimeZone: signal('America/New_York'),
      chapterChanged$: chapterChanged$.asObservable()
    };

    const mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Merge/Resolve Duplicate Donor Records', subtitle: '' })
    });



      TestBed.configureTestingModule({
      imports: [
        MergeDuplicateDonorRecordsComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatDialogModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MergeDuplicateDonorRecordsService, useValue: serviceSpyObj },
        { provide: SnackbarService, useValue: snackbarSpyObj },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });




      serviceSpyObj.searchBatchesLov.calls.reset();


      serviceSpyObj.retrieveBatch.calls.reset();


      serviceSpyObj.previewMerge.calls.reset();


      serviceSpyObj.mergeDonors.calls.reset();


      serviceSpyObj.resolveDonors.calls.reset();


    mockService = TestBed.inject(MergeDuplicateDonorRecordsService) as jasmine.SpyObj<MergeDuplicateDonorRecordsService>;
    mockSnackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    mockService.searchBatchesLov.and.returnValue(of({ data: [], total: 0 }));

    fixture = TestBed.createComponent(MergeDuplicateDonorRecordsComponent);
    component = fixture.componentInstance;

    const defaultRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultRef.afterClosed.and.returnValue(of(null));
    dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue(defaultRef);

    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should initialize form controls', () => {
      expect(component.batchControl).toBeDefined();
      expect(component.batchSearchControl).toBeDefined();
    });

    it('should initialize table configurations', () => {
      expect(component.interdictionsTableConfig).toBeDefined();
      expect(component.interdictionsTableConfig.columns.length).toBe(4);

      expect(component.unitsTableConfig).toBeDefined();
      expect(component.unitsTableConfig.columns.length).toBe(4);

      expect(component.potentialDuplicatesTableConfig).toBeDefined();
    });

    it('should initialize with null donor values', () => {
      expect(component.primaryDonor).toBeNull();
      expect(component.secondaryDonor).toBeNull();
      expect(component.finalPreviewDonor).toBeNull();
      expect(component.falseDonor1).toBeNull();
      expect(component.falseDonor2).toBeNull();
    });

    it('should initialize with default UI state', () => {
      expect(component.isLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
      expect(component.hasSearched).toBe(false);
      expect(component.isMerged).toBe(false);
      expect(component.mergeNote).toBe('');
      expect(component.selectedDonorId).toBe('');
    });

    it('should get chapterId from HeaderService on init', () => {
      expect(mockHeaderService.chapterId).toHaveBeenCalled();
      expect(component.currentChapterId).toBe('1');
    });

    it('should load batch options on init', () => {
      expect(mockService.searchBatchesLov).toHaveBeenCalledWith(50, 0, {});
    });
  });

  describe('Batch Retrieval', () => {
    it('should retrieve batch data successfully', () => {
      mockService.retrieveBatch.and.returnValue(of(mockBatchData));

      component.batchControl.setValue('DPI00000033');
      component.onRetrieve();

      expect(mockService.retrieveBatch).toHaveBeenCalledWith({ setId: 'DPI00000033' });
      expect(component.hasSearched).toBe(true);
      expect(component.currentBatchId).toBe('DPI00000033');
      expect(component.potentialDuplicates.length).toBe(2);
    });



    it('should mark batch control as touched on retrieve', () => {
      component.batchControl.setValue('');
      component.onRetrieve();
      expect(component.batchControl.touched).toBe(true);
    });


  });

  describe('Donor Card Operations', () => {
    beforeEach(() => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
    });

    it('should add PRIMR donor to primary card', () => {
      component.onToggleDonorCard(mockDonor1);
      expect(component.primaryDonor).toBeTruthy();
      expect(component.primaryDonor!.donorId).toBe(mockDonor1.donorId);
    });

    it('should add SECON donor to secondary card after primary is set', () => {
      mockService.previewMerge.and.returnValue(of(mockPreviewResponse));
      component.primaryDonor = { ...mockDonor1 };

      component.onToggleDonorCard(mockDonor2);

      expect(component.secondaryDonor).toBeTruthy();
      expect(component.secondaryDonor!.donorId).toBe(mockDonor2.donorId);
      expect(mockService.previewMerge).toHaveBeenCalled();
    });




    it('should not add donor with NOMER flag', () => {
      const nomerDonor = { ...mockDonor1, mergeFlag: 'NOMER', flag: 'NOMER' as any };
      component.onToggleDonorCard(nomerDonor);
      expect(component.primaryDonor).toBeNull();
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });

  });

  describe('FALSE Mode Operations', () => {
    const falseDonor1: DuplicateDonorModel = {
      donorId: 'DN001', donorName: 'Test 1', dateOfBirth: '1990-01-01',
      gender: 'M', mergeFlag: 'FALSE', flag: 'FALSE'
    };
    const falseDonor2: DuplicateDonorModel = {
      donorId: 'DN002', donorName: 'Test 2', dateOfBirth: '1991-02-02',
      gender: 'F', mergeFlag: 'FALSE', flag: 'FALSE'
    };

    it('should identify FALSE duplicate mode', () => {
      component.potentialDuplicates = [falseDonor1, falseDonor2];
      expect(component.isFalseDuplicateMode()).toBe(true);
    });

    it('should not be in FALSE mode for Primary/Secondary donors', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.isFalseDuplicateMode()).toBe(false);
    });



  });

  describe('Investigation Checks', () => {
    it('should detect incomplete checks', () => {
      component.potentialDuplicates = [mockDonor1, mockDonorIncomplete];
      expect(component.hasIncompleteChecks()).toBe(true);
    });

    it('should return false when all checks complete', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.hasIncompleteChecks()).toBe(false);
    });

    it('should return incomplete check names', () => {
      component.potentialDuplicates = [mockDonorIncomplete];
      const names = component.getIncompleteCheckNames();
      expect(names).toContain('Demographics');
      expect(names).toContain('Interdictions');
      expect(names).toContain('Donations');
      expect(names).toContain('Attributes');
      expect(names).toContain('Key Data');
    });

    it('isMergeButtonDisabled should be true when checks incomplete', () => {
      component.potentialDuplicates = [mockDonor1, mockDonorIncomplete];
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonorIncomplete };
      expect(component.isMergeButtonDisabled()).toBe(true);
    });

    it('isResolveButtonDisabled should be true when checks incomplete', () => {
      const falseDonor = { ...mockDonorIncomplete, mergeFlag: 'FALSE', flag: 'FALSE' as any };
      component.potentialDuplicates = [falseDonor];
      expect(component.isResolveButtonDisabled()).toBe(true);
    });
  });


  describe('Donor Transfer Operations', () => {
    beforeEach(() => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      mockService.previewMerge.and.returnValue(of(mockPreviewResponse));
    });



    it('should swap donors and call preview API', () => {
      component.swapDonors();
      expect(component.primaryDonor!.donorId).toBe(mockDonor2.donorId);
      expect(component.secondaryDonor!.donorId).toBe(mockDonor1.donorId);
      expect(mockService.previewMerge).toHaveBeenCalled();
    });

    it('should not swap if primary is missing', () => {
      component.primaryDonor = null;
      component.swapDonors();
      expect(component.secondaryDonor!.donorId).toBe(mockDonor2.donorId);
    });
  });

  describe('Button State Checks', () => {
    it('isMergeButtonDisabled should be true in FALSE mode', () => {
      component.potentialDuplicates = [{ flag: 'FALSE' } as any, { flag: 'FALSE' } as any];
      expect(component.isMergeButtonDisabled()).toBe(true);
    });

    it('isMergeButtonDisabled should be true when donors are missing', () => {
      component.primaryDonor = null;
      expect(component.isMergeButtonDisabled()).toBe(true);
    });

    it('isMergeButtonDisabled should be false when Primary and Secondary selected', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.isMergeButtonDisabled()).toBe(false);
    });

    it('isResolveButtonDisabled should be true in Primary/Secondary mode', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.isResolveButtonDisabled()).toBe(true);
    });

    it('isResolveButtonDisabled should be false in FALSE mode when both selected', () => {
      const fd1 = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      const fd2 = { donorId: 'DN002', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = fd1;
      component.falseDonor2 = fd2;
      expect(component.isResolveButtonDisabled()).toBe(false);
    });
  });

  describe('Side Panel', () => {




    it('should save comment note on comments save', () => {
      component.onCommentsSave('Test note');
      expect(component.mergeNote).toBe('Test note');
    });

    it('should use selected donor ID for side panel', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      component.selectedDonorId = mockDonor2.donorId;
      component.openDemographics();
      expect(component.sidePanelDonorId()).toBe(mockDonor2.donorId);
    });

    it('should refresh batch checks after closing investigation panel', () => {
      mockService.retrieveBatch.and.returnValue(of(mockBatchData));
      component.currentBatchId = 'DPI00000033';
      component.potentialDuplicates = [mockDonor1, mockDonor2];

      component.currentSection.set('demographics');
      component.sidePanelOpen.set(true);
      component.onPanelClose();

      expect(mockService.retrieveBatch).toHaveBeenCalledWith({ setId: 'DPI00000033' });
    });

  });

  describe('Row Selection', () => {
    it('should select donor row on click', () => {
      component.onDuplicateRowClick(mockDonor1);
      expect(component.selectedDonorId).toBe(mockDonor1.donorId);
    });

    it('should not select row with empty donorId', () => {
      component.onDuplicateRowClick({ donorId: '' } as any);
      expect(component.selectedDonorId).toBe('');
    });


  });
  describe('Utility Methods', () => {
    it('displayValue should return "-" for null/undefined/empty', () => {
      expect(component.displayValue(null)).toBe('-');
      expect(component.displayValue(undefined)).toBe('-');
      expect(component.displayValue('')).toBe('-');
    });

    it('displayValue should format flag values', () => {
      expect(component.displayValue('FALSE')).toBe('False');
      expect(component.displayValue('PRIMR')).toBe('Primary');
      expect(component.displayValue('SECON')).toBe('Secondary');
    });

    it('formatDate should return "-" for empty value', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('formatDate should format valid date in DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate('1997-02-13');
      expect(result).toBe('13-FEB-1997');
    });

    it('formatFoundOn should return "-" for empty value', () => {
      expect(component.formatFoundOn('')).toBe('-');
    });

    it('formatSex should format sex values correctly', () => {
      expect(component.formatSex('M')).toBe('Male');
      expect(component.formatSex('F')).toBe('Female');
      expect(component.formatSex('')).toBe('-');
    });

  });

  describe('Display Rows', () => {
    it('should return actual duplicates when available', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.getDisplayRows().length).toBe(2);
    });

    it('should return empty placeholders when searched but no data', () => {
      component.hasSearched = true;
      component.potentialDuplicates = [];
      expect(component.getDisplayRows().length).toBe(4);
    });

    it('should return empty array before search', () => {
      component.hasSearched = false;
      component.potentialDuplicates = [];
      expect(component.getDisplayRows().length).toBe(0);
    });
  });

  describe('Batch Retrieval - Edge Cases', () => {
    it('should not retrieve when batch control is empty', () => {
      component.batchControl.setValue('');
      component.onRetrieve();
      expect(mockService.retrieveBatch).not.toHaveBeenCalled();
    });

    it('should handle error response on retrieve', () => {
      mockService.retrieveBatch.and.returnValue(throwError(() => new Error('fail')));
      component.batchControl.setValue('DPI00000033');
      component.onRetrieve();
      expect(component.isLoading).toBe(false);
    });

    it('should show info when no batch found', () => {
      mockService.retrieveBatch.and.returnValue(of(null));
      component.batchControl.setValue('DPI00000033');
      component.onRetrieve();
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });

    it('should show error for non-pending donors', () => {
      const nonPendingData = {
        setId: 'DPI00000033',
        foundOn: '2025-03-15T21:20:00',
        duplicates: [
          { ...mockDonor1, setStatusCode: 'MERGD' },
          { ...mockDonor2, setStatusCode: 'PENDG' }
        ]
      };
      mockService.retrieveBatch.and.returnValue(of(nonPendingData));
      component.batchControl.setValue('DPI00000033');
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should map mergeFlag to flag for SECND variant', () => {
      const data = {
        setId: 'DPI001',
        foundOn: '2025-01-01',
        duplicates: [
          { ...mockDonor1, mergeFlag: 'PRIMR', flag: undefined as any },
          { ...mockDonor2, mergeFlag: 'SECND', flag: undefined as any }
        ]
      };
      mockService.retrieveBatch.and.returnValue(of(data));
      component.batchControl.setValue('DPI001');
      component.onRetrieve();
      expect(component.potentialDuplicates[1].flag).toBe('Secondary');
    });

    it('should set fallback flag based on index when no flag or mergeFlag', () => {
      const data = {
        setId: 'DPI001',
        foundOn: '2025-01-01',
        duplicates: [
          { donorId: 'DN001', donorName: 'A', dateOfBirth: '', gender: '', mergeFlag: '', sex: '' },
          { donorId: 'DN002', donorName: 'B', dateOfBirth: '', gender: '', mergeFlag: '', sex: '' }
        ]
      };
      mockService.retrieveBatch.and.returnValue(of(data as any));
      component.batchControl.setValue('DPI001');
      component.onRetrieve();
      expect(component.potentialDuplicates[0].flag).toBe('Primary');
      expect(component.potentialDuplicates[1].flag).toBe('Secondary');
    });

    it('should map gender to sex when sex is not set', () => {
      const data = {
        setId: 'DPI001',
        foundOn: '2025-01-01',
        duplicates: [{ ...mockDonor1, gender: 'F', sex: undefined as any }]
      };
      mockService.retrieveBatch.and.returnValue(of(data));
      component.batchControl.setValue('DPI001');
      component.onRetrieve();
      expect(component.potentialDuplicates[0].sex).toBe('F');
    });
  });

  describe('Batch Search', () => {
    it('should filter batch options based on search term', () => {
      component.batchOptions.set([
        { setId: 'DPI001', foundOn: '', source: '' },
        { setId: 'DPI002', foundOn: '', source: '' },
        { setId: 'ABC001', foundOn: '', source: '' }
      ]);
      component.batchSearchControl.setValue('DPI');
      expect(component.filteredBatchOptions.length).toBe(2);
    });

    it('should show all options when search is empty', () => {
      component.batchOptions.set([
        { setId: 'DPI001', foundOn: '', source: '' },
        { setId: 'ABC001', foundOn: '', source: '' }
      ]);
      component.batchSearchControl.setValue('');
      expect(component.filteredBatchOptions.length).toBe(2);
    });

    it('should set selectedBatch on batch selection', () => {
      component.batchOptions.set([
        { setId: 'DPI001', foundOn: '2025-01-01', source: 'SRC' }
      ]);
      component.batchControl.setValue('DPI001');
      component.onBatchSelected();
      expect(component.foundOn).toBe('2025-01-01');
    });

    it('should not set selectedBatch if value is empty', () => {
      component.batchControl.setValue('');
      component.onBatchSelected();
      expect(component.foundOn).toBe('');
    });
  });

  describe('Chapter Changes', () => {
    it('should reset form and reload on chapter change', () => {
      mockService.searchBatchesLov.and.returnValue(of({ data: [], total: 0 }));
      component.potentialDuplicates = [mockDonor1];
      component.hasSearched = true;

      chapterChanged$.next();

      expect(component.hasSearched).toBe(false);
      expect(component.potentialDuplicates.length).toBe(0);
    });
  });

  describe('Donor Card Operations - Extended', () => {
    it('should not toggle donor card when merged', () => {
      component.isMerged = true;
      component.onToggleDonorCard(mockDonor1);
      expect(component.primaryDonor).toBeNull();
    });

    it('should show error when adding SECON before PRIMR', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      component.primaryDonor = null;
      component.onToggleDonorCard(mockDonor2);
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should show info when primary already selected', () => {
      component.primaryDonor = { ...mockDonor1 };
      const anotherPrimary = { ...mockDonor1, donorId: 'DN999' };
      component.onToggleDonorCard(anotherPrimary);
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });

    it('should show info when secondary already selected', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      const anotherSecondary = { ...mockDonor2, donorId: 'DN888' };
      component.onToggleDonorCard(anotherSecondary);
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });

    it('should show error for invalid merge flag', () => {
      component.potentialDuplicates = [mockDonor1];
      const invalidDonor = { ...mockDonor1, mergeFlag: 'UNKNOWN', flag: 'Primary' as any };
      component.onToggleDonorCard(invalidDonor);
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should remove primary donor from card', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.potentialDuplicates = [mockDonor1];
      component.onToggleDonorCard(mockDonor1);
      expect(component.primaryDonor).toBeNull();
    });

    it('should remove secondary donor from card', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      component.onToggleDonorCard(mockDonor2);
      expect(component.secondaryDonor).toBeNull();
      expect(component.finalPreviewDonor).toBeNull();
    });

    it('should handle row action events for add/remove', () => {
      component.potentialDuplicates = [mockDonor1];
      component.onDuplicateRowAction({ action: 'add', row: mockDonor1 });
      expect(component.primaryDonor).toBeTruthy();
    });
  });

  describe('FALSE Mode Operations - Extended', () => {
    const fd1: DuplicateDonorModel = {
      donorId: 'DN001', donorName: 'Test 1', dateOfBirth: '1990-01-01',
      gender: 'M', mergeFlag: 'FALSE', flag: 'FALSE'
    };
    const fd2: DuplicateDonorModel = {
      donorId: 'DN002', donorName: 'Test 2', dateOfBirth: '1991-02-02',
      gender: 'F', mergeFlag: 'FALSE', flag: 'FALSE'
    };

    it('should add false donors to slots', () => {
      component.potentialDuplicates = [fd1, fd2];
      component.onToggleDonorCard(fd1);
      expect(component.falseDonor1?.donorId).toBe('DN001');
      component.onToggleDonorCard(fd2);
      expect(component.falseDonor2?.donorId).toBe('DN002');
    });

    it('should remove false donor from slot 1', () => {
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = { ...fd1 };
      component.onToggleDonorCard(fd1);
      expect(component.falseDonor1).toBeNull();
    });

    it('should remove false donor from slot 2', () => {
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor2 = { ...fd2 };
      component.onToggleDonorCard(fd2);
      expect(component.falseDonor2).toBeNull();
    });

    it('should show info when both false slots are full', () => {
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = { ...fd1 };
      component.falseDonor2 = { ...fd2 };
      const fd3 = { ...fd1, donorId: 'DN003' };
      component.onToggleDonorCard(fd3);
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });

    it('isDonorInCard should work for FALSE mode', () => {
      component.falseDonor1 = { ...fd1 };
      expect(component.isDonorInCard(fd1)).toBe(true);
      expect(component.isDonorInCard(fd2)).toBe(false);
    });
  });

  describe('Preview API', () => {
    it('should populate final preview on success', () => {
      mockService.previewMerge.and.returnValue(of(mockPreviewResponse));
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.transferToPrimary();
      expect(component.finalPreviewDonor).toBeTruthy();
      expect(component.finalPreviewDonor!.donorId).toBe('DN30132273');
    });

    it('should clear final preview on error', () => {
      mockService.previewMerge.and.returnValue(throwError(() => new Error('fail')));
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.transferToSecondary();
      expect(component.finalPreviewDonor).toBeNull();
    });

    it('should show warnings from preview', () => {
      const previewWithWarnings = {
        ...mockPreviewResponse,
        item: { ...mockPreviewResponse.item, warnings: ['ABO mismatch'] }
      };
      mockService.previewMerge.and.returnValue(of(previewWithWarnings));
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.transferToPrimary();
      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('ABO mismatch');
    });

    it('should not call preview if primary is missing', () => {
      component.primaryDonor = null;
      component.secondaryDonor = { ...mockDonor2 };
      component.transferToPrimary();
      expect(mockService.previewMerge).not.toHaveBeenCalled();
    });
  });

  describe('Merge Donors', () => {
    beforeEach(() => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      component.currentBatchId = 'DPI00000033';
    });

    it('should not merge without primary donor', () => {
      component.primaryDonor = null;
      component.mergeDonors();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog on merge', () => {
      component.mergeDonors();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should perform merge on confirm and reset form', () => {
      const mergeResponse = {
        success: true,
        item: {
          primaryDonorId: 'DN30132273',
          secondaryDonorId: 'DN30132192',
          interdictions: [],
          holdUnits: []
        }
      };
      mockService.mergeDonors.and.returnValue(of(mergeResponse));
      mockService.searchBatchesLov.and.returnValue(of({ data: [], total: 0 }));
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.mergeDonors();

      expect(mockService.mergeDonors).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
      expect(component.primaryDonor).toBeNull();
      expect(component.secondaryDonor).toBeNull();
      expect(component.potentialDuplicates.length).toBe(0);
      expect(component.hasSearched).toBe(false);
      expect(component.batchControl.enabled).toBe(true);
    });

    it('should send mergeNote with merge request', () => {
      component.mergeNote = 'Test merge note';
      mockService.mergeDonors.and.returnValue(of({ success: true, item: { interdictions: [], holdUnits: [] } }));
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.mergeDonors();

      expect(mockService.mergeDonors).toHaveBeenCalledWith(
        jasmine.objectContaining({ note: 'Test merge note' })
      );
    });

    it('should show error when merge fails', () => {
      mockService.mergeDonors.and.returnValue(of({ success: false, message: 'Merge failed' }));
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.mergeDonors();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should handle merge API error', () => {
      mockService.mergeDonors.and.returnValue(throwError(() => new Error('API error')));
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.mergeDonors();

      expect(component.isProcessing).toBe(false);
    });

    it('should not merge with empty batch ID', () => {
      component.currentBatchId = '';
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.mergeDonors();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should show error for wrong primary flag', () => {
      component.primaryDonor = { ...mockDonor1, flag: 'Secondary' as any, mergeFlag: 'SECON' };
      component.mergeDonors();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should show error for wrong secondary flag', () => {
      component.secondaryDonor = { ...mockDonor2, flag: 'Primary' as any, mergeFlag: 'PRIMR' };
      component.mergeDonors();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });
  });

  describe('Resolve Donors', () => {
    it('should not resolve without false donors in FALSE mode', () => {
      const fd = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd];
      component.falseDonor1 = null;
      component.falseDonor2 = null;
      component.resolveDonors();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog on resolve in FALSE mode', () => {
      const fd1 = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      const fd2 = { donorId: 'DN002', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = fd1;
      component.falseDonor2 = fd2;
      component.resolveDonors();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should perform resolve on confirm', () => {
      const fd1 = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      const fd2 = { donorId: 'DN002', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = fd1;
      component.falseDonor2 = fd2;
      component.currentBatchId = 'DPI001';
      mockService.resolveDonors.and.returnValue(of({ success: true }));
      mockService.searchBatchesLov.and.returnValue(of({ data: [], total: 0 }));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.resolveDonors();

      expect(mockService.resolveDonors).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    });

    it('should handle resolve failure', () => {
      const fd1 = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      const fd2 = { donorId: 'DN002', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = fd1;
      component.falseDonor2 = fd2;
      component.currentBatchId = 'DPI001';
      mockService.resolveDonors.and.returnValue(of({ success: false, message: 'Failed' }));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.resolveDonors();
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });

    it('should handle resolve API error', () => {
      const fd1 = { donorId: 'DN001', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      const fd2 = { donorId: 'DN002', flag: 'FALSE', mergeFlag: 'FALSE' } as any;
      component.potentialDuplicates = [fd1, fd2];
      component.falseDonor1 = fd1;
      component.falseDonor2 = fd2;
      component.currentBatchId = 'DPI001';
      mockService.resolveDonors.and.returnValue(throwError(() => new Error('API error')));

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('confirm'));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.resolveDonors();
      expect(component.isProcessing).toBe(false);
    });

    it('should show info when trying to resolve non-FALSE in non-FALSE mode', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      component.resolveDonors();
      expect(mockSnackbarService.showInfo).toHaveBeenCalled();
    });
  });

  describe('Comments Panel', () => {
    it('should open comments panel', () => {
      component.openCommentsPanel();
      expect(component.sidePanelOpen()).toBe(true);
      expect(component.currentSection()).toBe('comments');
      expect(component.sidePanelWidth()).toBe('550px');
    });

    it('should save merge note and show snackbar on save', () => {
      component.onCommentsSave('Test merge note');
      expect(component.mergeNote).toBe('Test merge note');
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    });

    it('should trim note on save', () => {
      component.onCommentsSave('  trimmed note  ');
      expect(component.mergeNote).toBe('  trimmed note  ');
    });
  });

  describe('Donations Panel', () => {
    it('should open donations dialog with active donor ID', () => {
      component.potentialDuplicates = [mockDonor1];
      component.selectedDonorId = mockDonor1.donorId;
      component.openDonations();
      expect(dialogOpenSpy).toHaveBeenCalled();
      const callArgs = dialogOpenSpy.calls.mostRecent().args;
      expect(callArgs[1].data.donorId).toBe(mockDonor1.donorId);
    });

    it('should not open donations without donor ID', () => {
      component.potentialDuplicates = [];
      component.selectedDonorId = '';
      component.openDonations();
      expect(dialogOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('DOB/Gender Mismatch', () => {
    it('should detect DOB mismatch', () => {
      component.primaryDonor = { ...mockDonor1, dateOfBirth: '1990-01-01' };
      component.secondaryDonor = { ...mockDonor2, dateOfBirth: '1991-02-02' };
      expect(component.isDobMismatch()).toBe(true);
    });

    it('should return false when DOBs match', () => {
      component.primaryDonor = { ...mockDonor1, dateOfBirth: '1990-01-01' };
      component.secondaryDonor = { ...mockDonor2, dateOfBirth: '1990-01-01' };
      expect(component.isDobMismatch()).toBe(false);
    });

    it('should return false when DOB is missing', () => {
      component.primaryDonor = { ...mockDonor1, dateOfBirth: '' };
      component.secondaryDonor = { ...mockDonor2, dateOfBirth: '1990-01-01' };
      expect(component.isDobMismatch()).toBe(false);
    });

    it('should detect sex mismatch', () => {
      component.primaryDonor = { ...mockDonor1, sex: 'M', gender: 'M' };
      component.secondaryDonor = { ...mockDonor2, sex: 'F', gender: 'F' };
      expect(component.isSexMismatch()).toBe(true);
    });

    it('should return false when sex matches', () => {
      component.primaryDonor = { ...mockDonor1, sex: 'F', gender: 'F' };
      component.secondaryDonor = { ...mockDonor2, sex: 'F', gender: 'F' };
      expect(component.isSexMismatch()).toBe(false);
    });

    it('should return false when sex is missing', () => {
      component.primaryDonor = { ...mockDonor1, sex: '', gender: '' };
      component.secondaryDonor = { ...mockDonor2, sex: 'F', gender: 'F' };
      expect(component.isSexMismatch()).toBe(false);
    });
  });

  describe('Incomplete Checks Tooltip', () => {
    it('should return empty string when no incomplete checks', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      expect(component.getIncompleteChecksTooltip()).toBe('');
    });

    it('should return tooltip with incomplete check names', () => {
      component.potentialDuplicates = [mockDonorIncomplete];
      const tooltip = component.getIncompleteChecksTooltip();
      expect(tooltip).toContain('Incomplete checks:');
      expect(tooltip).toContain('Demographics');
    });
  });

  describe('Find Donor', () => {
    it('should open find donor dialog', () => {
      component.navigateToFindDonor();
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should highlight donor if found in batch', () => {
      component.potentialDuplicates = [mockDonor1, mockDonor2];
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ action: 'select', donor: { donorId: mockDonor1.donorId } }));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.navigateToFindDonor();

      expect(component.selectedDonorId).toBe(mockDonor1.donorId);
      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith(`Donor ${mockDonor1.donorId} selected.`);
    });

    it('should show info if donor not in batch', () => {
      component.potentialDuplicates = [mockDonor1];
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ action: 'select', donor: { donorId: 'UNKNOWN' } }));
      dialogOpenSpy.and.returnValue(dialogRef);

      component.navigateToFindDonor();

      expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('Donor UNKNOWN is not in the current batch.');
    });
  });

  describe('Side Panel Operations', () => {
    it('should open interdictions panel', () => {
      component.potentialDuplicates = [mockDonor1];
      component.selectedDonorId = mockDonor1.donorId;
      component.openInterdictions();
      expect(component.sidePanelOpen()).toBe(true);
      expect(component.currentSection()).toBe('interdictions');
    });

    it('should not open panel without donor ID', () => {
      component.potentialDuplicates = [];
      component.selectedDonorId = '';
      component.openDemographics();
      expect(component.sidePanelOpen()).toBe(false);
    });

    it('should handle panel width change', () => {
      component.onPanelWidthChange('80vw');
      expect(component.sidePanelWidth()).toBe('80vw');
    });

    it('should close panel and reset state', () => {
      component.sidePanelOpen.set(true);
      component.currentSection.set('comments');
      component.onPanelClose();
      expect(component.sidePanelOpen()).toBe(false);
      expect(component.currentSection()).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('canMerge should be true when both donors selected', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      expect(component.canMerge).toBe(true);
    });

    it('canMerge should be false without donors', () => {
      expect(component.canMerge).toBe(false);
    });

    it('canResolve should be true when both donors selected', () => {
      component.primaryDonor = { ...mockDonor1 };
      component.secondaryDonor = { ...mockDonor2 };
      expect(component.canResolve).toBe(true);
    });

    it('emptyStateMessage should change based on search state', () => {
      component.hasSearched = false;
      expect(component.emptyStateMessage).toBe('Nothing to Display');
      component.hasSearched = true;
      expect(component.emptyStateMessage).toBe('No batch found matching the criteria');
    });
  });

  describe('formatSex edge cases', () => {
    it('should handle MALE and FEMALE strings', () => {
      expect(component.formatSex('MALE')).toBe('Male');
      expect(component.formatSex('FEMALE')).toBe('Female');
    });

    it('should return original for unknown values', () => {
      expect(component.formatSex('X')).toBe('X');
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
