import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { InvestigateDuplicateDonorRecords } from './investigate-duplicate-donor-records';
import { InvestigateDuplicateDonorRecordsApiService } from './services/investigate-duplicate-donor-records-api.service';
import { InvestigateDuplicateStateService } from './services/investigate-duplicate-state.service';
import { DonorWithinTestService } from '../../../donor-within-test/services/donor-within-test.service';
import { DonorDemographicsService } from '../../../donor-demographics/services/donor-demographics.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoginService } from '@shared/services/login.service';
import {
  InvestigateBatch,
  InvestigateBatchDetails,
  InvestigateDonor,
  CreateSetRow,
  INVEST_ERROR_MESSAGES,
  EMPTY_REVIEW_CATEGORY,
  EMPTY_MATCH_FLAGS
} from './models/investigate-duplicate-donor-records.model';

describe('InvestigateDuplicateDonorRecords', () => {
  let component: InvestigateDuplicateDonorRecords;
  let fixture: ComponentFixture<InvestigateDuplicateDonorRecords>;
  let apiServiceSpy: jasmine.SpyObj<InvestigateDuplicateDonorRecordsApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let donorDemoServiceSpy: jasmine.SpyObj<DonorDemographicsService>;
  let dialog: MatDialog;

  const mockDonor: InvestigateDonor = {
    donorId: 'DN30132192',
    setId: 'DP00000033',
    setStatusCode: 'PENDG',
    name: 'Shelia Rogers',
    dateOfBirth: '1994-01-11',
    gender: 'F',
    mergeFlag: 'PRIMR',
    address: '82 LONG 13E DALLAS TX 75235',
    altAddress: '123 ALT STREET DALLAS TX 75235',
    workPhone: '214-885-1214',
    homePhone: '214-558-4545',
    demographics: { ...EMPTY_REVIEW_CATEGORY },
    keydata: { ...EMPTY_REVIEW_CATEGORY },
    interdictions: { ...EMPTY_REVIEW_CATEGORY },
    donations: { ...EMPTY_REVIEW_CATEGORY },
    attributes: { ...EMPTY_REVIEW_CATEGORY },
    matchFlags: { ...EMPTY_MATCH_FLAGS },
    resolveUser: null,
    resolveUserName: null,
    resolveDate: null,
    programId: 'DRUREHLD',
    chapterId: '001'
  };

  const mockDonor2: InvestigateDonor = {
    ...mockDonor,
    donorId: 'DN30132273',
    name: 'Shelia Panerahe',
    mergeFlag: 'NOMER',
    address: '234 CHANEL DRIVE DALLAS TX 75235',
    altAddress: null,
    workPhone: null,
    homePhone: '214-332-1834'
  };

  const mockBatch: InvestigateBatch = {
    batchId: 'DP00000033',
    setStatusCode: 'PENDG',
    foundOn: '2025-03-15T21:20:00Z',
    source: 'Registration',
    programId: 'DRUREHLD',
    duplicateCount: 2,
    reviewProgress: { demographics: 0, keydata: 0, interdictions: 0, donations: 0, attributes: 0 }
  };

  const mockBatches: InvestigateBatch[] = [mockBatch];

  const mockBatchDetails: InvestigateBatchDetails = {
    batch: mockBatch,
    donors: [mockDonor, mockDonor2]
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('InvestigateDuplicateDonorRecordsApiService', [
      'getDuplicateSets', 'getPotentialDuplicates', 'updateReviewCategory',
      'updateMergeFlag', 'updateSetStatus', 'resolveSet', 'getStatusCodes',
      'createSet', 'addDonorToSet'
    ]);
    const donorDemoSpy = jasmine.createSpyObj('DonorDemographicsService', ['getDemographics']);
    const stateServiceSpy = jasmine.createSpyObj('InvestigateDuplicateStateService', ['save', 'restore']);
    stateServiceSpy.restore.and.returnValue(null);
    const snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({})
    });
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Investigate Duplicate Donor Records', subtitle: '' })
    });
    const headerServiceSpy = jasmine.createSpyObj('HeaderService', ['getCurrentUsername', 'chapterTimeZone'], {
      chapterChanged$: of(),
      headerConfig: signal({ user: { name: 'Test User' } })
    });
    headerServiceSpy.getCurrentUsername.and.returnValue('Test User');
    headerServiceSpy.chapterTimeZone.and.returnValue('UTC');
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    const donorWithinTestServiceSpy = jasmine.createSpyObj('DonorWithinTestService', [
      'getDonations', 'getTestResults', 'getConfirmatoryTests'
    ]);

    routerSpyObj.createUrlTree.and.returnValue({});
    routerSpyObj.serializeUrl.and.returnValue('');
    loginServiceSpy.getStoredUsername.and.returnValue('Ann Walton Peter');
    donorWithinTestServiceSpy.getDonations.and.returnValue(of([]));
    donorWithinTestServiceSpy.getTestResults.and.returnValue(of([]));
    donorWithinTestServiceSpy.getConfirmatoryTests.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InvestigateDuplicateDonorRecords, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: InvestigateDuplicateDonorRecordsApiService, useValue: apiSpy },
        { provide: InvestigateDuplicateStateService, useValue: stateServiceSpy },
        { provide: DonorDemographicsService, useValue: donorDemoSpy },
        { provide: DonorWithinTestService, useValue: donorWithinTestServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InvestigateDuplicateDonorRecords);
    component = fixture.componentInstance;
    apiServiceSpy = TestBed.inject(InvestigateDuplicateDonorRecordsApiService) as jasmine.SpyObj<InvestigateDuplicateDonorRecordsApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    donorDemoServiceSpy = TestBed.inject(DonorDemographicsService) as jasmine.SpyObj<DonorDemographicsService>;
    dialog = (component as any).dialog;

    apiServiceSpy.getDuplicateSets.and.returnValue(of(mockBatches));
    apiServiceSpy.getStatusCodes.and.returnValue(of([
      { statusCode: 'PENDG', description: 'Pending' },
      { statusCode: 'INVAL', description: 'Invalid' }
    ]));
  });

  describe('Initialization', () => {

    it('should initialize form with empty batch ID', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('batchId')?.value).toBe('');
    });

    it('should load batches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getDuplicateSets).toHaveBeenCalledWith({ statusCode: 'PENDG' });
      expect(component.batches().length).toBe(1);
    }));

    it('should load status codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getStatusCodes).toHaveBeenCalled();
      expect(component.statusCodes().length).toBe(2);
    }));
  });

  describe('Retrieve Button', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should mark batch field as touched when no batch selected', () => {
      component.onRetrieve();
      expect(component.filterForm.get('batchId')?.touched).toBeTrue();
    });

    it('should retrieve potential duplicates on click', fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));

      tick();
      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      expect(apiServiceSpy.getPotentialDuplicates).toHaveBeenCalledWith('DP00000033');
      expect(component.donors().length).toBe(2);
      expect(component.hasRetrieved()).toBeTrue();
    }));

    it('should handle 404 error when retrieving', fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(throwError(() => ({ status: 404 })));

      tick();
      component.filterForm.patchValue({ batchId: 'INVALID' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.donors().length).toBe(0);
    }));

  });

  describe('Table Data', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));


    it('should auto-select first row after retrieve', () => {
      expect(component.selectedDonor()).toBeTruthy();
      expect(component.selectedDonor()!.donorId).toBe('DN30132192');
    });


    it('should format date of birth', () => {
      const rows = component.tableData();
      expect(rows[0].dateOfBirth).toContain('JAN');
      expect(rows[0].dateOfBirth).toContain('1994');
    });

    it('should display sex correctly', () => {
      const rows = component.tableData();
      expect(rows[0].sex).toBe('Female');
    });

    it('should include alt address', () => {
      const rows = component.tableData();
      expect(rows[0].altAddress).toBeTruthy();
      expect(rows[1].altAddress).toBe('');
    });
  });

  describe('Diff Highlighting', () => {
    it('should highlight differing fields across donors', fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      const rows = component.tableData();
      const secondRow = rows[1];
      expect(secondRow.highlightDonorName).toBeTrue();
      expect(secondRow.highlightHomeNumber).toBeTrue();
      expect(secondRow.highlightAddress).toBeTrue();
    }));
  });

  describe('Row Selection', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
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
      expect(component.selectedDonor()!.donorId).toBe('DN30132273');
    });

    it('should sync local state from selected donor', () => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      expect(component.localMergeFlag()).toBe('NOMER');
    });
  });

  describe('Investigation Panel', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      apiServiceSpy.updateReviewCategory.and.returnValue(of({
        success: true, data: [{ isChecked: 'Y', reviewUser: 'USR001', reviewUserName: 'Test User', reviewDate: '2025-05-20T15:30:00' }],
        message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.updateMergeFlag.and.returnValue(of({
        success: true, data: [{ mergeFlag: 'SECON' }],
        message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should display investigation donor name', () => {
      expect(component.investigationDonorName).toBe('Shelia Rogers');
    });

    it('should open side panel for selected section', () => {
      component.onOpenSection('demographics');

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.currentCheckDonorId()).toBe('DN30132192');
      expect(component.currentSection()).toBe('demographics');
    });


    it('should toggle checkbox locally without immediate API call', () => {
      component.onMarkAsChecked('demographics', true);

      expect(component.localSectionChecks().demographics).toBeTrue();
      expect(component.hasLocalChanges()).toBeTrue();
      expect(apiServiceSpy.updateReviewCategory).not.toHaveBeenCalled();
    });

    it('should update merge flag locally without immediate API call', () => {
      component.onMergeFlagChange('SECON');

      expect(component.localMergeFlag()).toBe('SECON');
      expect(component.hasLocalChanges()).toBeTrue();
      expect(apiServiceSpy.updateMergeFlag).not.toHaveBeenCalled();
    });

    it('should return Not Visited for unchecked section', () => {
      expect(component.getVisitStatus('demographics')).toBe('Not Visited');
    });

    it('should return Checked for locally checked section', () => {
      component.onMarkAsChecked('demographics', true);
      expect(component.getVisitStatus('demographics')).toBe('Checked');
    });
  });

  describe('Save Changes', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      apiServiceSpy.updateReviewCategory.and.returnValue(of({
        success: true, data: [], message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.updateMergeFlag.and.returnValue(of({
        success: true, data: [], message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));



    it('should call review and merge flag APIs on save', fakeAsync(() => {
      component.onMarkAsChecked('demographics', true);
      component.onMergeFlagChange('PRIMR');

      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      component.onSaveChanges();
      tick();

      expect(apiServiceSpy.updateReviewCategory).toHaveBeenCalledTimes(5);
      expect(apiServiceSpy.updateMergeFlag).toHaveBeenCalledTimes(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Changes saved successfully');
    }));
  });

  describe('Resolve Investigation', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should not be enabled when donors have NOMER flag', () => {
      expect(component.isCommitEnabled).toBeFalse();
    });


    it('should commit successfully when no local changes pending', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      apiServiceSpy.resolveSet.and.returnValue(of({
        success: true, data: [{ setId: 'DP00000033', resolveUser: 'USR01', resolveDate: '2025-05-20', resolvedDonors: 2 }],
        message: 'Duplicate set resolved successfully',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));

      component.onCommitInvestigation();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should save pending changes and commit when local changes exist', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      apiServiceSpy.updateReviewCategory.and.returnValue(of({
        success: true, data: [], message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.updateMergeFlag.and.returnValue(of({
        success: true, data: [], message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.resolveSet.and.returnValue(of({
        success: true, data: [{ setId: 'DP00000033', resolveUser: 'USR01', resolveDate: '2025-05-20', resolvedDonors: 2 }],
        message: 'Duplicate set resolved successfully',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));

      component.onMergeFlagChange('PRIMR');

      component.onCommitInvestigation();
      tick();

      expect(apiServiceSpy.updateReviewCategory).toHaveBeenCalled();
      expect(apiServiceSpy.updateMergeFlag).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));
  });

  describe('Invalidate Batch', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));


    it('should invalidate on confirm', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);
      apiServiceSpy.updateSetStatus.and.returnValue(of({
        success: true, data: [{ setId: 'DP00000033', statusCode: 'INVAL', updatedRecords: 2 }],
        message: null, error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.getDuplicateSets.and.returnValue(of([]));

      component.onInvalidateBatch();
      tick();

      expect(apiServiceSpy.updateSetStatus).toHaveBeenCalledWith('DP00000033', { statusCode: 'INVAL' });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

  });

  describe('Batch Display Fields', () => {

    it('should display batch status after retrieve', fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      expect(component.batchStatusDisplay).toBe('Pending');
    }));

    it('should display formatted found on date', fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      expect(component.foundOnDisplay).toContain('MAR');
      expect(component.foundOnDisplay).toContain('2025');
    }));
  });

  describe('Resolved State', () => {
    it('should disable controls when set is resolved', fakeAsync(() => {
      const resolvedBatch: InvestigateBatch = { ...mockBatch, setStatusCode: 'RESOL' };
      const resolvedDetails: InvestigateBatchDetails = {
        batch: resolvedBatch,
        donors: [{ ...mockDonor, setStatusCode: 'RESOL' }, { ...mockDonor2, setStatusCode: 'RESOL' }]
      };
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(resolvedDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();

      expect(component.isResolved).toBeTrue();
      expect(component.isCommitEnabled).toBeFalse();
    }));
  });

  describe('Date Formatting', () => {


    it('should format date time', () => {
      const formatted = component.formatDateTime('2025-03-15T21:20:00Z');
      expect(formatted).toContain('MAR');
      expect(formatted).toContain('2025');
    });

  });

  describe('Investigation Pending', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should return true when not all sections checked', () => {
      expect(component.isInvestigationPending('DN30132192')).toBeTrue();
    });

    it('should return true for unknown donor', () => {
      expect(component.isInvestigationPending('UNKNOWN')).toBeTrue();
    });
  });

  describe('Create New Set Mode', () => {
    const mockCreateSetResponse = {
      success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
      error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
    };

    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call createSet API when NEW is selected and retrieved', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of(mockCreateSetResponse));

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      expect(apiServiceSpy.createSet).toHaveBeenCalled();
    }));

    it('should initialize 2 empty rows after successful createSet', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of(mockCreateSetResponse));

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      expect(component.createSetRows.length).toBe(2);
      expect(component.createSetRows[0].form.get('donorId')?.value).toBe('');
      expect(component.createSetRows[1].form.get('donorId')?.value).toBe('');
    }));

    it('should show error snackbar on createSet failure', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(throwError(() => ({ displayMessage: 'Server error' })));

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
    }));

    it('should set isNewSetMode to true after create', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of(mockCreateSetResponse));

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      expect(component.isNewSetMode()).toBeTrue();
    }));

    it('should set batch status to PENDG', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of(mockCreateSetResponse));

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      expect((component as any).batchStatusControl.value).toBe('PENDG');
    }));
  });

  describe('Create Set Row Management', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of({
        success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();
    }));

    it('should add a row with NOMER default merge flag', () => {
      const initialCount = component.createSetRows.length;
      component.addCreateSetRow();

      expect(component.createSetRows.length).toBe(initialCount + 1);
      expect(component.createSetRows[component.createSetRows.length - 1].form.get('mergeFlag')?.value).toBe('NOMER');
    });

    it('should remove a row at the given index', () => {
      component.addCreateSetRow();
      const countAfterAdd = component.createSetRows.length;

      component.removeCreateSetRow(countAfterAdd - 1);

      expect(component.createSetRows.length).toBe(countAfterAdd - 1);
    });

    it('should allow removing rows at index >= 2', () => {
      component.addCreateSetRow();
      expect(component.createSetRows.length).toBe(3);

      component.removeCreateSetRow(2);

      expect(component.createSetRows.length).toBe(2);
    });

    it('should increment createSetRows counter', () => {
      const countBefore = component.createSetRows.length;
      component.addCreateSetRow();
      component.addCreateSetRow();

      expect(component.createSetRows.length).toBe(countBefore + 2);
      expect(component.createSetRows[component.createSetRows.length - 1].id).toBeGreaterThan(
        component.createSetRows[component.createSetRows.length - 2].id
      );
    });
  });

  describe('Donor ID Validation (onDonorIdBlur)', () => {
    let row: CreateSetRow;

    beforeEach(fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of({
        success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      row = component.createSetRows[0];
    }));

    it('should set inline error when donor ID is empty', () => {
      row.form.patchValue({ donorId: '' });
      component.onDonorIdBlur(row, 0);

      expect(row.errors?.['donorId']).toBe('This field is required and cannot be left blank.');
    });

    it('should set donorValid to null when donor ID is empty', () => {
      row.form.patchValue({ donorId: '' });
      component.onDonorIdBlur(row, 0);

      expect(row.donorValid).toBeNull();
    });

    it('should show snackbar for duplicate donor ID across rows', () => {
      row.form.patchValue({ donorId: 'DN30132192' });
      const row2 = component.createSetRows[1];
      row2.form.patchValue({ donorId: 'DN30132192' });

      component.onDonorIdBlur(row2, 1);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Donor DN30132192 already exists in this set');
    });

    it('should set donorValid to false for duplicate donor ID', () => {
      row.form.patchValue({ donorId: 'DN30132192' });
      const row2 = component.createSetRows[1];
      row2.form.patchValue({ donorId: 'DN30132192' });

      component.onDonorIdBlur(row2, 1);

      expect(row2.donorValid).toBeFalse();
    });

    it('should populate donorData for valid donor ID', fakeAsync(() => {
      donorDemoServiceSpy.getDemographics.and.returnValue(of({
        header: { name: 'John Doe', dateOfBirth: '1990-01-01', sex: 'M' },
        address: { streetName: '123 Main St', suiteApt: '', city: 'Dallas', state: 'TX', zip: '75235' },
        phones: { work: { areaCode: '214', phoneNo: '555-0100' }, home: { areaCode: '214', phoneNo: '555-0200' } }
      } as any));

      row.form.patchValue({ donorId: 'DN30132192' });
      component.onDonorIdBlur(row, 0);
      tick();

      expect(row.donorValid).toBeTrue();
      expect(row.donorData).toBeTruthy();
      expect(row.donorData!.name).toBe('John Doe');
    }));

    it('should clear errors for valid donor ID', fakeAsync(() => {
      donorDemoServiceSpy.getDemographics.and.returnValue(of({
        header: { name: 'John Doe', dateOfBirth: '1990-01-01', sex: 'M' },
        address: { streetName: '123 Main St', suiteApt: '', city: 'Dallas', state: 'TX', zip: '75235' },
        phones: { work: { areaCode: '214', phoneNo: '555-0100' }, home: { areaCode: '214', phoneNo: '555-0200' } }
      } as any));

      row.errors = { donorId: 'some previous error' };
      row.form.patchValue({ donorId: 'DN30132192' });
      component.onDonorIdBlur(row, 0);
      tick();

      expect(row.errors).toEqual({});
    }));

    it('should show snackbar when donor not found', fakeAsync(() => {
      donorDemoServiceSpy.getDemographics.and.returnValue(throwError(() => ({
        error: { message: 'Donor INVALID123 does not exist' }
      })));

      row.form.patchValue({ donorId: 'INVALID123' });
      component.onDonorIdBlur(row, 0);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should set donorValid to false when donor not found', fakeAsync(() => {
      donorDemoServiceSpy.getDemographics.and.returnValue(throwError(() => ({
        error: { message: 'Donor INVALID123 does not exist' }
      })));

      row.form.patchValue({ donorId: 'INVALID123' });
      component.onDonorIdBlur(row, 0);
      tick();

      expect(row.donorValid).toBeFalse();
    }));

    it('should set donorLoading to false after validation completes', fakeAsync(() => {
      donorDemoServiceSpy.getDemographics.and.returnValue(of({
        header: { name: 'John Doe', dateOfBirth: '1990-01-01', sex: 'M' },
        address: { streetName: '123 Main St', suiteApt: '', city: 'Dallas', state: 'TX', zip: '75235' },
        phones: { work: { areaCode: '214', phoneNo: '555-0100' }, home: { areaCode: '214', phoneNo: '555-0200' } }
      } as any));

      row.form.patchValue({ donorId: 'DN30132192' });
      component.onDonorIdBlur(row, 0);
      tick();

      expect(row.donorLoading).toBeFalse();
      expect(row.donorValid).toBeTrue();
    }));
  });

  describe('Create Set Error State Helpers', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of({
        success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();
    }));

    it('should return true from hasRowErrors when errors exist', () => {
      const row = component.createSetRows[0];
      row.errors = { donorId: 'This field is required and cannot be left blank.' };

      expect(component.hasRowErrors(row)).toBeTrue();
    });

    it('should return false from hasRowErrors when errors are empty', () => {
      const row = component.createSetRows[0];
      row.errors = {};

      expect(component.hasRowErrors(row)).toBeFalse();
    });

    it('should return true from hasCreateSetErrors when any row has errors', () => {
      component.createSetRows[0].errors = { donorId: 'required' };

      expect(component.hasCreateSetErrors).toBeTrue();
    });

    it('should return false from hasCreateSetErrors when no rows have errors', () => {
      component.createSetRows[0].errors = {};
      component.createSetRows[1].errors = {};

      expect(component.hasCreateSetErrors).toBeFalse();
    });

    it('should return false from isNewSetSaveEnabled when errors exist', () => {
      component.createSetRows[0].errors = { donorId: 'required' };

      expect(component.isNewSetSaveEnabled()).toBeFalse();
    });

    it('should return false from isNewSetSaveEnabled while saving', () => {
      component.createSetRows[0].errors = {};
      component.createSetRows[1].errors = {};
      component.isSavingNewSet.set(true);

      expect(component.isNewSetSaveEnabled()).toBeFalse();
    });

    it('should return true from isNewSetSaveEnabled when no errors and not saving', () => {
      component.createSetRows[0].errors = {};
      component.createSetRows[1].errors = {};
      component.isSavingNewSet.set(false);

      expect(component.isNewSetSaveEnabled()).toBeTrue();
    });
  });

  describe('Save New Set', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of({
        success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();
    }));

    it('should set inline error for empty donor ID rows on save', () => {
      component.createSetRows[0].form.patchValue({ donorId: '' });
      component.createSetRows[1].form.patchValue({ donorId: '' });

      component.onSaveNewSet();

      expect(component.createSetRows[0].errors?.['donorId']).toBe('This field is required and cannot be left blank.');
      expect(component.createSetRows[1].errors?.['donorId']).toBe('This field is required and cannot be left blank.');
    });

    it('should show snackbar when invalid donors exist', fakeAsync(() => {
      component.createSetRows[0].form.patchValue({ donorId: 'DN001' });
      component.createSetRows[0].donorValid = false;
      component.createSetRows[1].form.patchValue({ donorId: 'DN002' });
      component.createSetRows[1].donorValid = true;
      component.createSetRows[1].errors = {};

      component.onSaveNewSet();
      tick();

      expect(apiServiceSpy.addDonorToSet).not.toHaveBeenCalled();
    }));

    it('should require minimum 2 valid donors', fakeAsync(() => {
      component.createSetRows[0].form.patchValue({ donorId: 'DN001' });
      component.createSetRows[0].donorValid = true;
      component.createSetRows[0].errors = {};
      component.createSetRows[1].form.patchValue({ donorId: 'DN002' });
      component.createSetRows[1].donorValid = false;
      component.createSetRows[1].errors = {};

      component.onSaveNewSet();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please enter valid donor IDs for all rows');
      expect(apiServiceSpy.addDonorToSet).not.toHaveBeenCalled();
    }));

    it('should call addDonorToSet for each row on successful save', fakeAsync(() => {
      component.createSetRows[0].form.patchValue({ donorId: 'DN001' });
      component.createSetRows[0].donorValid = true;
      component.createSetRows[0].errors = {};
      component.createSetRows[1].form.patchValue({ donorId: 'DN002' });
      component.createSetRows[1].donorValid = true;
      component.createSetRows[1].errors = {};

      apiServiceSpy.addDonorToSet.and.returnValue(of({
        success: true, data: [], message: 'Donor added',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));

      component.onSaveNewSet();
      tick();

      expect(apiServiceSpy.addDonorToSet).toHaveBeenCalledTimes(2);
      expect(apiServiceSpy.addDonorToSet).toHaveBeenCalledWith('DUPLI09883', { donorId: 'DN001' });
      expect(apiServiceSpy.addDonorToSet).toHaveBeenCalledWith('DUPLI09883', { donorId: 'DN002' });
    }));

    it('should switch to view mode on successful save', fakeAsync(() => {
      component.createSetRows[0].form.patchValue({ donorId: 'DN001' });
      component.createSetRows[0].donorValid = true;
      component.createSetRows[0].errors = {};
      component.createSetRows[1].form.patchValue({ donorId: 'DN002' });
      component.createSetRows[1].donorValid = true;
      component.createSetRows[1].errors = {};

      apiServiceSpy.addDonorToSet.and.returnValue(of({
        success: true, data: [], message: 'Donor added',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));

      component.onSaveNewSet();
      tick();

      expect(component.isNewSetMode()).toBeFalse();
    }));

    it('should show snackbar on save error', fakeAsync(() => {
      component.createSetRows[0].form.patchValue({ donorId: 'DN001' });
      component.createSetRows[0].donorValid = true;
      component.createSetRows[0].errors = {};
      component.createSetRows[1].form.patchValue({ donorId: 'DN002' });
      component.createSetRows[1].donorValid = true;
      component.createSetRows[1].errors = {};

      apiServiceSpy.addDonorToSet.and.returnValue(throwError(() => ({
        displayMessage: 'Failed to add donor DN001'
      })));

      component.onSaveNewSet();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add donor DN001');
    }));
  });

  describe('Merge Flag Validation', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should reject PRIMR when another donor is already PRIMR', fakeAsync(() => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      component.onMergeFlagChange('PRIMR');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('already marked as Primary')
      );
    }));

    it('should reject SECON when another donor is already SECON', fakeAsync(() => {
      const donorsWithSecon = [
        { ...mockDonor, mergeFlag: 'NOMER' },
        { ...mockDonor2, mergeFlag: 'SECON' }
      ];
      const detailsWithSecon: InvestigateBatchDetails = {
        batch: mockBatch,
        donors: donorsWithSecon
      };
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(detailsWithSecon));
      component.onRetrieve();
      tick();

      component.onMergeFlagChange('SECON');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('already marked as Secondary')
      );
    }));

    it('should reject FALSE when PRIMR exists', fakeAsync(() => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      component.onMergeFlagChange('FALSE');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Cannot set False Duplicate when Primary or Secondary')
      );
    }));

    it('should reject PRIMR when FALSE exists', fakeAsync(() => {
      const donorsWithFalse = [
        { ...mockDonor, mergeFlag: 'NOMER' },
        { ...mockDonor2, mergeFlag: 'FALSE' }
      ];
      const detailsWithFalse: InvestigateBatchDetails = {
        batch: mockBatch,
        donors: donorsWithFalse
      };
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(detailsWithFalse));
      component.onRetrieve();
      tick();

      component.onMergeFlagChange('PRIMR');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Cannot set Primary when False Duplicate')
      );
    }));

    it('should show error snackbar on merge flag conflict', fakeAsync(() => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      component.onMergeFlagChange('PRIMR');

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should revert merge flag after error', fakeAsync(() => {
      const rows = component.tableData();
      component.onRowClicked(rows[1]);

      const originalFlag = component.localMergeFlag();
      component.onMergeFlagChange('PRIMR');
      tick();

      expect(component.localMergeFlag()).toBe(originalFlag);
    }));
  });

  describe('Batch Search Filter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter batches by search term', fakeAsync(() => {
      component.batches.set([mockBatch, { ...mockBatch, batchId: 'DP99999999' }]);
      component.filteredBatches = [...component.batches()];

      component.batchSearchControl.setValue('DP000');
      tick();

      expect(component.filteredBatches.length).toBe(1);
      expect(component.filteredBatches[0].batchId).toBe('DP00000033');
    }));

    it('should show all batches when search is empty', fakeAsync(() => {
      component.batches.set([mockBatch, { ...mockBatch, batchId: 'DP99999999' }]);
      component.filteredBatches = [...component.batches()];

      component.batchSearchControl.setValue('');
      tick();

      expect(component.filteredBatches.length).toBe(2);
    }));
  });

  describe('Unsaved Changes', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should show dialog when retrieving with unsaved changes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      component.onMarkAsChecked('demographics', true);
      component.onRetrieve();
      tick();

      expect(dialog.open).toHaveBeenCalled();
    }));

    it('should show dialog when clicking different row with unsaved changes', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      component.onMarkAsChecked('demographics', true);
      const rows = component.tableData();
      component.onRowClicked(rows[1]);
      tick();

      expect(dialog.open).toHaveBeenCalled();
    }));
  });

  describe('Side Panel', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should close panel and reset state', fakeAsync(() => {
      component.onOpenSection('demographics');
      expect(component.sidePanelOpen()).toBeTrue();

      component.onPanelClose();
      tick();

      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.currentCheckDonorId()).toBe('');
      expect(component.currentCheckDonorName()).toBe('');
      expect(component.currentSection()).toBeNull();
    }));

    it('should navigate to key data with state', fakeAsync(() => {
      const routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

      component.onOpenSection('keydata');
      tick();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/donor-functions/donor-profile/donor-data'],
        jasmine.objectContaining({
          state: jasmine.objectContaining({
            mode: 'modify',
            donorId: 'DN30132192',
            fromInvestigateDuplicate: true
          })
        })
      );
    }));
  });

  describe('Alt Address', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getPotentialDuplicates.and.returnValue(of(mockBatchDetails));
      fixture.detectChanges();
      tick();

      component.filterForm.patchValue({ batchId: 'DP00000033' });
      component.onRetrieve();
      tick();
    }));

    it('should open alt address dialog for view mode', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);
      const event = new MouseEvent('click');

      const rows = component.tableData();
      component.onAltAddressClick(event, rows[0]);

      expect(dialog.open).toHaveBeenCalled();
    });

    it('should open alt address dialog for create set mode', fakeAsync(() => {
      apiServiceSpy.createSet.and.returnValue(of({
        success: true, data: [{ setId: 'DUPLI09883' }], message: 'New set created',
        error: null, errorCode: null, statusCode: null, item: null, total: null, errorResponse: { errorCode: null, error: null }
      }));
      component.filterForm.patchValue({ batchId: 'NEW' });
      component.onRetrieve();
      tick();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);
      const event = new MouseEvent('click');

      const row = component.createSetRows[0];
      row.form.patchValue({ donorId: 'DN30132192' });
      row.donorValid = true;

      component.onCreateSetAltAddressClick(event, row);

      expect(dialog.open).toHaveBeenCalled();
    }));
  });

});
