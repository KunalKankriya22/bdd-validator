import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { PotentialDuplicateBatchQuery } from './potential-duplicate-batch-query';
import { PotentialDuplicateBatchQueryApiService } from './services/potential-duplicate-batch-query-api.service';
import { DonorWithinTestService } from '../../../donor-within-test/services/donor-within-test.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  PotentialDuplicateBatch,
  BatchDetails,
  DuplicateDonor,
  LastNameOption,
  PDMQ_ERROR_MESSAGES,
  EMPTY_REVIEW_CATEGORY,
  EMPTY_MATCH_FLAGS
} from './models/potential-duplicate-batch-query.model';

describe('PotentialDuplicateBatchQuery', () => {
  let donorWithinTestServiceSpy: any;
  let headerServiceSpy: any;
  let routerSpyObj: any;
  let apiSpy: any;
  let component: PotentialDuplicateBatchQuery;
  let fixture: ComponentFixture<PotentialDuplicateBatchQuery>;
  let apiServiceSpy: jasmine.SpyObj<PotentialDuplicateBatchQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockDonor: DuplicateDonor = {
    donorId: 'DN20111045',
    setId: 'DP00000033',
    name: 'Christopher Hunter',
    dateOfBirth: '1960-01-11',
    ssn: null,
    sex: 'Male',
    mergeFlag: 'Primary',
    workPhone: null,
    homePhone: '972-345-6787',
    mobilePhone: null,
    address: '237 PLEASANT RUN KELLER TX 76248',
    resolvedByUser: null,
    resolvedByUserName: null,
    dateResolved: null,
    programId: '',
    chapterId: null,
    transactionId: null,
    comments: null,
    insertDate: null,
    insertUser: null,
    demographics: { ...EMPTY_REVIEW_CATEGORY },
    keydata: { ...EMPTY_REVIEW_CATEGORY },
    interdictions: { ...EMPTY_REVIEW_CATEGORY },
    donations: { ...EMPTY_REVIEW_CATEGORY },
    attributes: { ...EMPTY_REVIEW_CATEGORY },
    matchFlags: { ...EMPTY_MATCH_FLAGS }
  };

  const mockBatches: PotentialDuplicateBatch[] = [
    {
      batchId: 'DP00000033',
      status: 'PENDG',
      foundOn: '2025-03-15T21:20:00Z',
      donorCount: 5
    }
  ];

  const mockLastNames: LastNameOption[] = [
    { lastName: 'Smith', setId: 'DP00000033', foundOn: null, setStatusCode: 'PENDG', source: null },
    { lastName: 'Jones', setId: 'DP00000034', foundOn: null, setStatusCode: 'PENDG', source: null },
    { lastName: 'Brown', setId: 'DP00000035', foundOn: null, setStatusCode: 'PENDG', source: null }
  ];

  const mockBatchDetails: BatchDetails = {
    batch: mockBatches[0],
    donors: [
      mockDonor,
      { ...mockDonor, donorId: 'DN20111046', name: 'Christopher Hunter Jr', mergeFlag: 'No Merge' },
      { ...mockDonor, donorId: 'DN20111047', name: 'John Smith' },
      { ...mockDonor, donorId: 'DN20111048', name: 'John Smith Jr', mergeFlag: 'No Merge' }
    ],
    duplicatePairs: [
      {
        pairId: 'PAIR-001',
        batchId: 'DP00000033',
        primaryDonor: mockDonor,
        secondaryDonor: { ...mockDonor, donorId: 'DN20111046', name: 'Christopher Hunter Jr', mergeFlag: 'No Merge' }
      },
      {
        pairId: 'PAIR-002',
        batchId: 'DP00000033',
        primaryDonor: { ...mockDonor, donorId: 'DN20111047', name: 'John Smith' },
        secondaryDonor: { ...mockDonor, donorId: 'DN20111048', name: 'John Smith Jr', mergeFlag: 'No Merge' }
      }
    ],
    totalPairs: 2
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('PotentialDuplicateBatchQueryApiService', [
      'getBatches',
      'getBatchDetails',
      'checkDonor',
      'resolveDuplicate',
      'getLastNames',
      'getSetIds',
      'getMergeStatuses',
      'updateSetStatus',
      'createSet',
      'updateMergeFlag'
    ]);
    const snackbarSpy = createMockSnackbarService();
    routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({})
    });
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Test', subtitle: 'Test subtitle' })
    });
    headerServiceSpy = createMockHeaderService();
    donorWithinTestServiceSpy = jasmine.createSpyObj('DonorWithinTestService', [
      'getDonations',
      'getTestResults',
      'getConfirmatoryTests'
    ]);

    headerServiceSpy.chapterChanged$ = of();
    routerSpyObj.createUrlTree.and.returnValue({});
    routerSpyObj.serializeUrl.and.returnValue('');
    donorWithinTestServiceSpy.getDonations.and.returnValue(of([]));
    donorWithinTestServiceSpy.getTestResults.and.returnValue(of([]));
    donorWithinTestServiceSpy.getConfirmatoryTests.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [PotentialDuplicateBatchQuery, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: PotentialDuplicateBatchQueryApiService, useValue: apiSpy },
        { provide: DonorWithinTestService, useValue: donorWithinTestServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      apiSpy.getBatches.calls.reset();


      apiSpy.getBatchDetails.calls.reset();


      apiSpy.checkDonor.calls.reset();


      apiSpy.resolveDuplicate.calls.reset();


      apiSpy.getLastNames.calls.reset();


      apiSpy.getSetIds.calls.reset();


      apiSpy.getMergeStatuses.calls.reset();


      apiSpy.updateSetStatus.calls.reset();


      apiSpy.createSet.calls.reset();


      apiSpy.updateMergeFlag.calls.reset();


      routerSpyObj.navigate.calls.reset();


      routerSpyObj.createUrlTree.calls.reset();


      routerSpyObj.serializeUrl.calls.reset();
      donorWithinTestServiceSpy.getDonations.calls.reset();


      donorWithinTestServiceSpy.getTestResults.calls.reset();


      donorWithinTestServiceSpy.getConfirmatoryTests.calls.reset();


      routerSpyObj.createUrlTree.and.returnValue({});


      routerSpyObj.serializeUrl.and.returnValue('');


      donorWithinTestServiceSpy.getDonations.and.returnValue(of([]));


      donorWithinTestServiceSpy.getTestResults.and.returnValue(of([]));


      donorWithinTestServiceSpy.getConfirmatoryTests.and.returnValue(of([]));


    fixture = TestBed.createComponent(PotentialDuplicateBatchQuery);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(PotentialDuplicateBatchQueryApiService) as jasmine.SpyObj<PotentialDuplicateBatchQueryApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    apiServiceSpy.getBatches.and.returnValue(of(mockBatches));
    apiServiceSpy.getLastNames.and.returnValue(of(mockLastNames));


    });

  describe('Initialization', () => {




    it('should load batches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('PENDG');
      expect(component.batches().length).toBe(1);
    }));

    it('should have batch status options', () => {
      expect(component.batchStatusOptions.length).toBe(3);
      expect(component.batchStatusOptions[0].value).toBe('PENDG');
      expect(component.batchStatusOptions[1].value).toBe('INVAL');
      expect(component.batchStatusOptions[2].value).toBe('RESOL');
    });
  });

  describe('Load Batches', () => {
    it('should load batches successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.batches().length).toBe(1);
      expect(component.batches()[0].batchId).toBe('DP00000033');
      expect(component.isLoadingBatches()).toBeFalse();
    }));

    it('should handle error when loading batches', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => ({ displayMessage: 'Error loading batches' })));

      fixture.detectChanges();
      tick();

      expect(component.batches().length).toBe(0);
      expect(component.isLoadingBatches()).toBeFalse();
    }));

    it('should reload batches when status changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      apiServiceSpy.getBatches.calls.reset();
      apiServiceSpy.getBatches.and.returnValue(of([]));
      apiServiceSpy.getLastNames.and.returnValue(of([]));

      component.filterForm.patchValue({ batchStatus: 'RESOL' });
      tick();

      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('RESOL');
    }));
  });

  describe('Retrieve Button', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should retrieve batch details on click', fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));

      tick();
      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      expect(apiServiceSpy.getBatchDetails).toHaveBeenCalledWith('DP00000033');
      expect(component.donors().length).toBe(4);
      expect(component.hasRetrieved()).toBeTrue();
    }));

    it('should handle error when retrieving batch details', fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(throwError(() => ({ status: 404 })));

      tick();
      component.filterForm.patchValue({ batchId: 'INVALID' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(PDMQ_ERROR_MESSAGES.BATCH_NOT_FOUND);
      expect(component.donors().length).toBe(0);
    }));


  });

  describe('Table Data', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));



    it('should auto-select first row after retrieve', () => {
      expect(component.selectedDonor()).toBeTruthy();
      expect(component.selectedDonor()!.donorId).toBe('DN20111045');
    });



    it('should format date of birth', () => {
      const rows = component.tableData();
      expect(rows[0].dateOfBirth).toContain('JAN');
      expect(rows[0].dateOfBirth).toContain('1960');
    });

    it('should include ssn and mobileNumber fields', () => {
      const rows = component.tableData();
      expect(rows[0].ssn).toBeDefined();
      expect(rows[0].mobileNumber).toBeDefined();
    });
  });

  describe('Diff Highlighting', () => {
    it('should highlight differing fields across donors', fakeAsync(() => {
      const detailsWithDiffs: BatchDetails = {
        ...mockBatchDetails,
        donors: [
          { ...mockDonor, name: 'Alice', homePhone: '111-111-1111' },
          { ...mockDonor, donorId: 'DN2', name: 'Bob', homePhone: '222-222-2222' }
        ]
      };
      apiServiceSpy.getBatchDetails.and.returnValue(of(detailsWithDiffs));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      const rows = component.tableData();
      const secondRow = rows[1];
      expect(secondRow.highlightDonorName).toBeTrue();
      expect(secondRow.highlightHomeNumber).toBeTrue();
    }));
  });

  describe('Row Selection', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should select donor on row click', () => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      expect(component.selectedDonor()).toBe(rows[1]);
      expect(component.selectedDonor()!.donorId).toBe('DN20111046');
    });
  });

  describe('Last Name Filtering', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should populate last name options', () => {
      expect(component.lastNameOptions().length).toBeGreaterThan(0);
    });

    // Note: Client-side lastName filtering is not implemented
    // The backend API handles filtering via query parameters
    // tableData() shows all donors in the retrieved set
  });

  describe('Investigation Panel', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should open side panel for selected donor', () => {
      const rows = component.tableData();
      component.onRowClicked(rows[0]);
      component.onOpenInvestigation('demographics');

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentCheckDonorId()).toBe('DN20111045');
      expect(component.currentCheckDonorName()).toBe('Christopher Hunter');
    });

    it('should default to first donor when none selected', () => {
      component.selectedDonor.set(null);
      component.onOpenInvestigation('demographics');

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentCheckDonorId()).toBe('DN20111045');
    });

    it('should open side panel for interdictions section', () => {
      const rows = component.tableData();
      component.onRowClicked(rows[0]);
      component.onOpenInvestigation('interdictions');

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentSection()).toBe('interdictions');
      expect(component.currentCheckDonorId()).toBe('DN20111045');
    });



    it('should call API when check is completed', fakeAsync(() => {
      apiServiceSpy.checkDonor.and.returnValue(of({ success: true }));
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));

      component.currentCheckDonorId.set('DN20111045');
      component.onCheckCompleted(['demographics', 'interdictions']);
      tick();

      expect(apiServiceSpy.checkDonor).toHaveBeenCalledWith({
        donorId: 'DN20111045',
        batchId: 'DP00000033',
        sectionsChecked: ['demographics', 'interdictions']
      });
    }));

    it('should handle error when checking donor fails', fakeAsync(() => {
      apiServiceSpy.checkDonor.and.returnValue(throwError(() => ({ displayMessage: 'Check failed' })));

      component.currentCheckDonorId.set('DN20111045');
      component.onCheckCompleted(['demographics']);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Check failed');
    }));
  });

  describe('Investigation Pending', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getBatchDetails.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should return true when not all sections are checked', () => {
      expect(component.isInvestigationPending('DN20111045')).toBeTrue();
    });

    it('should return true for unknown donor', () => {
      expect(component.isInvestigationPending('UNKNOWN')).toBeTrue();
    });
  });

  describe('Found On Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display -- when no batch selected', () => {
      expect(component.foundOnDisplay).toBe('--');
    });

    it('should display formatted date when batch selected', fakeAsync(() => {
      component.filterForm.patchValue({ batchId: 'DP00000033' });
      tick();
      fixture.detectChanges();

      expect(component.foundOnDisplay).toContain('MAR');
      expect(component.foundOnDisplay).toContain('2025');
    }));
  });

  describe('Date Time Formatting', () => {
    it('should format valid date time', () => {
      const formatted = component.formatDateTime('2025-03-15T21:20:00Z');
      expect(formatted).toContain('MAR');
      expect(formatted).toContain('2025');
    });


  });


  describe('Commit Investigation', () => {






    it('should call updateSetStatus when committing investigation', () => {
      const batchId = 'DUPLI123';
      component.filterForm.patchValue({ batchId });
      component.batchDetails.set({
        batch: { batchId: 'DUPLI123', status: 'PENDG', foundOn: '', donorCount: 1 },
        donors: [],
        duplicatePairs: [],
        totalPairs: 0
      });
      component.donors.set([
        {
          donorId: 'D001',
          setId: 'DUPLI123',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          ssn: null,
          sex: 'M',
          mergeFlag: 'PRIMR',
          address: null,
          workPhone: null,
          homePhone: null,
          mobilePhone: null,
          resolvedByUser: null,
          resolvedByUserName: null,
          dateResolved: null,
          programId: 'TEST',
          chapterId: 'CHAP01',
          transactionId: null,
          comments: null,
          insertDate: null,
          insertUser: null,
          demographics: { isChecked: 'Y', reviewUser: null, reviewUserName: null, reviewDate: null },
          keydata: { isChecked: 'Y', reviewUser: null, reviewUserName: null, reviewDate: null },
          interdictions: { isChecked: 'Y', reviewUser: null, reviewUserName: null, reviewDate: null },
          donations: { isChecked: 'Y', reviewUser: null, reviewUserName: null, reviewDate: null },
          attributes: { isChecked: 'Y', reviewUser: null, reviewUserName: null, reviewDate: null },
          matchFlags: { lastName: null, ssn: null, dob: null, sex: null }
        }
      ]);

      apiServiceSpy.updateSetStatus.and.returnValue(of({ success: true }));
      apiServiceSpy.getBatches.and.returnValue(of([]));
      apiServiceSpy.getLastNames.and.returnValue(of([]));

      component.onCommitInvestigation();

      expect(apiServiceSpy.updateSetStatus).toHaveBeenCalledWith(batchId, { statusCode: 'RESOL' });
    });
  });
});
