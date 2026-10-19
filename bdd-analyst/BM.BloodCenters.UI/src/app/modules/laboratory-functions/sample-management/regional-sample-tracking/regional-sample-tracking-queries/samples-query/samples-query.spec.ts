import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { SamplesQueryComponent } from './samples-query';
import { SamplesQueryApiService } from './services/samples-query-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { MatDialog } from '@angular/material/dialog';

describe('SamplesQueryComponent', () => {
  let component: SamplesQueryComponent;
  let fixture: ComponentFixture<SamplesQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<SamplesQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockSearchResults = [
    {
      unitId: 'W120624120401',
      chapterId: 'W1206',
      collDate: '2024-12-04T00:00:00',
      osUnitId: null,
      receivedDate: '2024-12-04T10:30:00',
      batchId: '120424-RG1883',
      contractId: 'WBCRG0183',
      driveId: null,
      priorAbo: 'O',
      donorDecisionCode: null,
      redTubeFlag: 'Y',
      purpleTubeFlag: 'Y',
      serumPlasmaInd: null,
      qcCheckinFlag: 'Y',
      qcCheckinDate: '2024-12-04T11:00:00',
      qcTestFlag: null,
      qcTestDate: null,
      noteId: null,
      company: 'Blood Center (W1206)',
    },
    {
      unitId: 'W120624120402',
      chapterId: 'W1206',
      collDate: '2024-12-04T00:00:00',
      osUnitId: 'OS12345',
      receivedDate: '2024-12-04T10:31:00',
      batchId: '120424-RG1883',
      contractId: 'WBCRG0183',
      driveId: null,
      priorAbo: 'A',
      donorDecisionCode: null,
      redTubeFlag: 'Y',
      purpleTubeFlag: null,
      serumPlasmaInd: null,
      qcCheckinFlag: 'Y',
      qcCheckinDate: '2024-12-04T11:00:00',
      qcTestFlag: null,
      qcTestDate: null,
      noteId: null,
      company: 'Blood Center (W1206)',
    },
  ];

  const mockUnitDetails = {
    unit: mockSearchResults[0],
    testResults: [
      { chapterId: 'DAL', testSeqNo: 1, testId: 'ABO', resultStatus1: 'O', absorbance: null, ratio: null, tbId: 'TB001', resultDats: '2024-12-04T12:00:00', extractId: null, resultsBatch: null, cnfrmQcDate: null, auditKey: 'AK1' },
      { chapterId: 'DAL', testSeqNo: 2, testId: 'RH', resultStatus1: 'POS', absorbance: null, ratio: null, tbId: 'TB001', resultDats: '2024-12-04T12:01:00', extractId: null, resultsBatch: null, cnfrmQcDate: null, auditKey: 'AK2' },
    ],
    attributes: [
      { attribGroup: 'ABO', attribGroupDesc: 'ABO Group', attribCode: 'O', attribCodeDesc: 'Type O', attribValue: 'O', effDate: '2024-12-04T00:00:00', termDate: null },
    ],
    interdictions: [
      { interCode: 'HOLD', interDescription: 'General Hold', interType: 'H' },
    ],
    hasNotes: false,
    hasInterdictions: true,
    hasDocuments: false,
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('SamplesQueryApiService', [
      'search', 'getUnitDetails', 'validateUnit', 'getBatches', 'getSampleNotes',
      'getCheckinNotes', 'getTestNotes', 'getNoteCounts',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
      headerConfig: signal({ user: { name: 'Test User', id: 'TEST1', role: 'User' } }),
    });
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate', 'getChapterLocalDateTime', 'fetchChapterTimezone',
    ]);
    apiServiceSpy.search.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockSearchResults, total: 2 }),
    );
    apiServiceSpy.getUnitDetails.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockUnitDetails }),
    );
    apiServiceSpy.validateUnit.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: true }),
    );
    apiServiceSpy.getBatches.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: [] }),
    );

      TestBed.configureTestingModule({
      imports: [SamplesQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SamplesQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
      ],
    });



      apiServiceSpy.search.calls.reset();

      apiServiceSpy.getUnitDetails.calls.reset();

      apiServiceSpy.validateUnit.calls.reset();

      apiServiceSpy.getBatches.calls.reset();

      apiServiceSpy.getSampleNotes.calls.reset();

      apiServiceSpy.getCheckinNotes.calls.reset();

      apiServiceSpy.getTestNotes.calls.reset();

      apiServiceSpy.getNoteCounts.calls.reset();

      pageHeaderServiceSpy.getTitle.calls.reset();

      pageHeaderServiceSpy.getSubtitle.calls.reset();

      headerServiceSpy.getCurrentChapterId.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDate.calls.reset();

      chapterTimezoneServiceSpy.getChapterLocalDateTime.calls.reset();

      chapterTimezoneServiceSpy.fetchChapterTimezone.calls.reset();

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);

      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);

    fixture = TestBed.createComponent(SamplesQueryComponent);
    component = fixture.componentInstance;
    dialogSpy = (component as any).dialog;

    });

  describe('Initialization', () => {

    it('should have no selected unit on init', () => {
      fixture.detectChanges();
      expect(component.selectedUnit()).toBeNull();
      expect(component.unitDetails()).toBeNull();
    });
  });

  describe('Search Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should detect criteria in unitId field', () => {
      component.validatedUnitId = 'W12345';
      expect(component.hasAnyCriteria()).toBeTrue();
    });

    it('should detect criteria in osUnitId field', () => {
      component.filterForm.patchValue({ osUnitId: 'OS123' });
      expect(component.hasAnyCriteria()).toBeTrue();
    });

    it('should detect criteria in batchId field', () => {
      component.filterForm.patchValue({ batchId: 'BATCH1' });
      expect(component.hasAnyCriteria()).toBeTrue();
    });

    it('should not detect criteria with whitespace only', () => {
      component.filterForm.patchValue({ osUnitId: '   ' });
      expect(component.hasAnyCriteria()).toBeFalse();
    });
  });

  describe('Retrieve (Main Query)', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call search API with correct params', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith(
        jasmine.objectContaining({ unitId: 'W120624120401' }),
        10,
        0,
      );
    }));

    it('should set totalRecords from response', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(component.totalRecords).toBe(2);
      expect(component.hasSearched).toBeTrue();
    }));

    it('should auto-select first row', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(component.selectedUnit()?.unitId).toBe('W120624120401');
      expect(apiServiceSpy.getUnitDetails).toHaveBeenCalledWith('W120624120401');
    }));
  });

  describe('Unit Details', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load details when search auto-selects first row', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.getUnitDetails).toHaveBeenCalledWith('W120624120401');
    }));

    it('should handle details API failure gracefully', fakeAsync(() => {
      apiServiceSpy.getUnitDetails.and.returnValue(throwError(() => ({ status: 500 })));
      component.onRowClick(mockSearchResults[0] as any);
      tick();
      expect(component.testResults()).toEqual([]);
      expect(component.attributes()).toEqual([]);
      expect(component.interdictions()).toEqual([]);
    }));
  });

  describe('Row Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should mark row as selected', fakeAsync(() => {
      component.onRowClick(mockSearchResults[0] as any);
      tick();
      expect(component.isRowSelected(mockSearchResults[0] as any)).toBeTrue();
      expect(component.isRowSelected(mockSearchResults[1] as any)).toBeFalse();
    }));
  });

  describe('Sorting', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset to default sort when cleared', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      apiServiceSpy.search.calls.reset();
      component.onSortChange({ active: '', direction: '' });
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith(
        jasmine.objectContaining({ sortColumn: 'CollDate', sortOrder: 'DESC' }),
        10,
        0,
      );
    }));
  });

  describe('Clear', () => {
    it('should reset all fields and results', fakeAsync(() => {
      fixture.detectChanges();
      component.validatedUnitId = 'W120624120401';
      component.filterForm.patchValue({ batchId: 'BATCH1' });
      component.units = mockSearchResults as any;
      component.hasSearched = true;
      component.totalRecords = 2;

      component.onClear();

      expect(component.validatedUnitId).toBeNull();
      expect(component.filterForm.get('osUnitId')?.value).toBe('');
      expect(component.filterForm.get('collDate')?.value).toBeNull();
      expect(component.filterForm.get('receivedDate')?.value).toBeNull();
      expect(component.filterForm.get('batchId')?.value).toBe('');
      expect(component.units).toEqual([]);
      expect(component.hasSearched).toBeFalse();
      expect(component.totalRecords).toBe(0);
      expect(component.selectedUnit()).toBeNull();
    }));
  });

  describe('Chapter Changes', () => {
    it('should clear and reset on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.validatedUnitId = 'W120624120401';
      component.hasSearched = true;

      chapterChangedSubject.next();
      tick();

      expect(component.validatedUnitId).toBeNull();
      expect(component.hasSearched).toBeFalse();
    }));
  });

  describe('isReactive', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return true for reactive codes', () => {
      expect(component.isReactive('R')).toBeTrue();
      expect(component.isReactive('RR')).toBeTrue();
      expect(component.isReactive('P')).toBeTrue();
      expect(component.isReactive('IR')).toBeTrue();
      expect(component.isReactive('RP')).toBeTrue();
      expect(component.isReactive('RN')).toBeTrue();
    });

    it('should return false for non-reactive codes', () => {
      expect(component.isReactive('NR')).toBeFalse();
      expect(component.isReactive('NEG')).toBeFalse();
      expect(component.isReactive('')).toBeFalse();
      expect(component.isReactive(null)).toBeFalse();
      expect(component.isReactive(undefined)).toBeFalse();
    });

    it('should be case-insensitive', () => {
      expect(component.isReactive('r')).toBeTrue();
      expect(component.isReactive('rr')).toBeTrue();
    });
  });

  describe('Test Result Sorting', () => {
    beforeEach(() => fixture.detectChanges());

    it('should sort test results ascending by default', () => {
      component.testResults.set([
        { chapterId: 'ZZZ' } as any,
        { chapterId: 'AAA' } as any,
      ]);
      const sorted = component.sortedTestResults();
      expect(sorted[0].chapterId).toBe('AAA');
      expect(sorted[1].chapterId).toBe('ZZZ');
    });

    it('should sort test results descending after toggle', () => {
      component.testResults.set([
        { chapterId: 'ZZZ' } as any,
        { chapterId: 'AAA' } as any,
      ]);
      component.toggleTestSort();
      expect(component.testSortDir).toBe('desc');
      const sorted = component.sortedTestResults();
      expect(sorted[0].chapterId).toBe('ZZZ');
      expect(sorted[1].chapterId).toBe('AAA');
    });

    it('should handle null chapterId in sorting', () => {
      component.testResults.set([
        { chapterId: null } as any,
        { chapterId: 'AAA' } as any,
      ]);
      const sorted = component.sortedTestResults();
      expect(sorted.length).toBe(2);
    });
  });

  describe('onUnitValidated and onUnitCleared', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set validated unit id and load batches', () => {
      component.onUnitValidated({ parsedUnitId: 'W120624120401', collectionDate: '2024-12-04' } as any);
      expect(component.validatedUnitId).toBe('W120624120401');
      expect(apiServiceSpy.getBatches).toHaveBeenCalled();
    });

    it('should set collection date when provided', () => {
      component.onUnitValidated({ parsedUnitId: 'W120624120401', collectionDate: '2024-12-04' } as any);
      expect(component.filterForm.get('collDate')?.value).toBeTruthy();
    });

    it('should not set collection date when not provided', () => {
      component.onUnitValidated({ parsedUnitId: 'W120624120401', collectionDate: null } as any);
      expect(component.filterForm.get('collDate')?.value).toBeNull();
    });

    it('should clear validated unit id on unit cleared', () => {
      component.validatedUnitId = 'W120624120401';
      component.onUnitCleared();
      expect(component.validatedUnitId).toBeNull();
      expect(component.selectedBatchId).toBeNull();
    });
  });

  describe('onBatchSelectionChange', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set batch id from string value', () => {
      component.onBatchSelectionChange('BATCH1');
      expect(component.selectedBatchId).toBe('BATCH1');
      expect(component.filterForm.get('batchId')?.value).toBe('BATCH1');
    });

    it('should handle array value', () => {
      component.onBatchSelectionChange(['BATCH1'] as any);
      expect(component.selectedBatchId).toBeNull();
    });

    it('should handle null value', () => {
      component.onBatchSelectionChange(null);
      expect(component.selectedBatchId).toBeNull();
    });

    it('should handle empty string', () => {
      component.onBatchSelectionChange('');
      expect(component.selectedBatchId).toBeNull();
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update page index and size', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      apiServiceSpy.search.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 25, length: 100 });
      tick();
      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(25);
      expect(apiServiceSpy.search).toHaveBeenCalled();
    }));
  });

  describe('onSortChange with active column', () => {
    beforeEach(() => fixture.detectChanges());

    it('should map sort column and set direction', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      apiServiceSpy.search.calls.reset();
      component.onSortChange({ active: 'unitId', direction: 'asc' });
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith(
        jasmine.objectContaining({ sortColumn: 'UnitId', sortOrder: 'ASC' }),
        jasmine.any(Number),
        0,
      );
    }));
  });

  describe('onTestResultClick', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set the selected test result', () => {
      const tr = { testId: 'ABO', auditKey: 'AK1' } as any;
      component.onTestResultClick(tr);
      expect(component.selectedTestResult()).toEqual(tr);
    });
  });

  describe('hasAnyFieldValue', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return true when validatedUnitId is set', () => {
      component.validatedUnitId = 'W12345';
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return false when no fields have values', () => {
      component.validatedUnitId = null;
      component.filterForm.reset({ osUnitId: '', collDate: null, receivedDate: null, batchId: '' });
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when collDate is set', () => {
      component.filterForm.patchValue({ collDate: moment() });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when receivedDate is set', () => {
      component.filterForm.patchValue({ receivedDate: moment() });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });
  });

  describe('formatDate and formatDateTime', () => {
    beforeEach(() => fixture.detectChanges());

    it('should format date', () => {
      const result = component.formatDate('2024-12-04T00:00:00');
      expect(typeof result).toBe('string');
    });

    it('should handle null date', () => {
      const result = component.formatDate(null);
      expect(typeof result).toBe('string');
    });

    it('should format date time', () => {
      const result = component.formatDateTime('2024-12-04T10:30:00');
      expect(typeof result).toBe('string');
    });

    it('should handle null date time', () => {
      const result = component.formatDateTime(null);
      expect(typeof result).toBe('string');
    });
  });

  describe('onRetrieve edge cases', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error when no criteria provided', () => {
      component.validatedUnitId = null;
      component.filterForm.reset({ osUnitId: '', collDate: null, receivedDate: null, batchId: '' });
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0903: At least one search criterion is required.');
    });

    it('should not execute when already loading', fakeAsync(() => {
      component.validatedUnitId = 'W120624120401';
      component.isLoading = true;
      component.onRetrieve();
      expect(apiServiceSpy.search).not.toHaveBeenCalled();
    }));

    it('should handle search API error', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(throwError(() => ({ status: 500 })));
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(component.isLoading).toBeFalse();
      expect(component.units).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle search API returning error response', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(
        of({ success: false, message: 'Search failed', statusCode: 400, data: null, errorResponse: { error: 'Bad request', errorCode: '0001' } } as any),
      );
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(component.units).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0001: Bad request');
    }));

    it('should handle search API returning error response without errorCode', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(
        of({ success: false, message: '', statusCode: 400, data: null, errorResponse: { error: 'Bad request' } } as any),
      );
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Bad request');
    }));

    it('should handle search API returning message only', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(
        of({ success: false, message: 'General error', statusCode: 400, data: null } as any),
      );
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('General error');
    }));

    it('should handle empty search results', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: [], total: 0 }),
      );
      component.validatedUnitId = 'W120624120401';
      component.onRetrieve();
      tick();
      expect(component.units).toEqual([]);
      expect(component.totalRecords).toBe(0);
    }));
  });

  describe('loadBatches', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load batch options on success', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(
        of({ success: true, message: '', statusCode: 200, data: ['B1', 'B2'] }),
      );
      component.onUnitValidated({ parsedUnitId: 'W120624120401', collectionDate: null } as any);
      tick();
      expect(component.batchOptions()).toEqual(['B1', 'B2']);
    }));

    it('should handle batch load error', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => new Error('fail')));
      component.onUnitValidated({ parsedUnitId: 'W120624120401', collectionDate: null } as any);
      tick();
      expect(component.batchOptions()).toEqual([]);
    }));
  });

  describe('quickLinks', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return quick links array', () => {
      const links = component.quickLinks;
      expect(links.length).toBe(10);
      expect(links[0].id).toBe('unit-test-details');
    });

    it('should disable view documents when no documents', () => {
      component.unitDetails.set({ hasDocuments: false } as any);
      const links = component.quickLinks;
      const viewDocs = links.find(l => l.id === 'view-documents');
      expect(viewDocs?.disabled).toBeTrue();
    });
  });

  describe('onQuickLinkClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.testResults.set(mockUnitDetails.testResults as any);
    });

    it('should do nothing when disabled', () => {
      component.onQuickLinkClick({ id: 'test', label: 'Test', disabled: true });
      // No error thrown
    });

    it('should do nothing when no selected unit', () => {
      component.selectedUnit.set(null);
      component.onQuickLinkClick({ id: 'unit-test-details', label: 'Unit Test Details' });
      // No error thrown
    });
  });

  describe('dialog operations', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);
    });

    it('should open attributes-interdictions dialog via quicklink', () => {
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.testResults.set(mockUnitDetails.testResults as any);
      component.attributes.set(mockUnitDetails.attributes as any);
      component.interdictions.set(mockUnitDetails.interdictions as any);
      component.onQuickLinkClick({ id: 'attributes-interdictions', label: 'Attributes and Interdictions' });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should open the sample checkin details dialog', () => {
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.openSampleCheckinDetails();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should not open sample checkin dialog when no unit selected', () => {
      component.selectedUnit.set(null);
      component.openSampleCheckinDetails();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open sample notes dialog on success', fakeAsync(() => {
      apiServiceSpy.getSampleNotes.and.returnValue(of({ success: true, data: [] } as any));
      apiServiceSpy.getNoteCounts.and.returnValue(of({ success: true, item: { sampleNoteCount: 0, tBatchNoteCount: 0, cBatchNoteCount: 0, testNoteCount: 0 } } as any));
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.openSampleNotes();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should open tbatch notes dialog', fakeAsync(() => {
      apiServiceSpy.getNoteCounts.and.returnValue(of({ success: true, item: { sampleNoteCount: 0, tBatchNoteCount: 0, cBatchNoteCount: 0, testNoteCount: 0 } } as any));
      component.selectedUnit.set({ unitId: 'U1', contractId: 'C1' } as any);
      component.testResults.set([{ tbId: 'TB001', testId: 'ABO' } as any]);
      component.openTBatchNotes();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should open cbatch notes dialog on success', fakeAsync(() => {
      apiServiceSpy.getCheckinNotes.and.returnValue(of({ success: true, data: [] } as any));
      apiServiceSpy.getNoteCounts.and.returnValue(of({ success: true, item: { sampleNoteCount: 0, tBatchNoteCount: 0, cBatchNoteCount: 0, testNoteCount: 0 } } as any));
      component.selectedUnit.set({ unitId: 'U1', batchId: 'B1' } as any);
      component.openCBatchNotes();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should open test notes dialog on success', fakeAsync(() => {
      apiServiceSpy.getTestNotes.and.returnValue(of({ success: true, data: [] } as any));
      apiServiceSpy.getNoteCounts.and.returnValue(of({ success: true, item: { sampleNoteCount: 0, tBatchNoteCount: 0, cBatchNoteCount: 0, testNoteCount: 0 } } as any));
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.selectedTestResult.set({ testId: 'ABO', auditKey: 'AK1' } as any);
      component.openTestNotes();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should open general notes dialog', fakeAsync(() => {
      apiServiceSpy.getNoteCounts.and.returnValue(of({ success: true, item: { sampleNoteCount: 0, tBatchNoteCount: 0, cBatchNoteCount: 0, testNoteCount: 0 } } as any));
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.openGeneralNotes();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));
  });

  describe('dialog guard conditions', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not open sample notes when no unit selected', () => {
      component.selectedUnit.set(null);
      component.openSampleNotes();
      expect(apiServiceSpy.getSampleNotes).not.toHaveBeenCalled();
    });

    it('should show error for sample notes when no collection date', () => {
      component.selectedUnit.set({ unitId: 'U1', collDate: null } as any);
      component.openSampleNotes();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Collection Date is required to view sample notes');
    });

    it('should show error on sample notes API failure', fakeAsync(() => {
      apiServiceSpy.getSampleNotes.and.returnValue(throwError(() => new Error('fail')));
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.openSampleNotes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load sample notes.');
    }));

    it('should not open tbatch notes when no unit selected', () => {
      component.selectedUnit.set(null);
      component.openTBatchNotes();
    });

    it('should not open tbatch notes when no tbId or contractId', () => {
      component.selectedUnit.set({ unitId: 'U1', contractId: null } as any);
      component.testResults.set([]);
      component.openTBatchNotes();
    });

    it('should not open cbatch notes when no batchId', () => {
      component.selectedUnit.set({ unitId: 'U1', batchId: null } as any);
      component.openCBatchNotes();
      expect(apiServiceSpy.getCheckinNotes).not.toHaveBeenCalled();
    });

    it('should show error on cbatch notes API failure', fakeAsync(() => {
      apiServiceSpy.getCheckinNotes.and.returnValue(throwError(() => new Error('fail')));
      component.selectedUnit.set({ unitId: 'U1', batchId: 'B1' } as any);
      component.openCBatchNotes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load check-in batch notes.');
    }));

    it('should not open test notes when no unit selected', () => {
      component.selectedUnit.set(null);
      component.openTestNotes();
      expect(apiServiceSpy.getTestNotes).not.toHaveBeenCalled();
    });

    it('should show error when no test result selected for test notes', () => {
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.selectedTestResult.set(null);
      component.openTestNotes();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a test result row first.');
    });

    it('should show error on test notes API failure', fakeAsync(() => {
      apiServiceSpy.getTestNotes.and.returnValue(throwError(() => new Error('fail')));
      component.selectedUnit.set(mockSearchResults[0] as any);
      component.selectedTestResult.set({ testId: 'ABO', auditKey: 'AK1' } as any);
      component.openTestNotes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load test notes.');
    }));

    it('should not open general notes when no unit selected', () => {
      component.selectedUnit.set(null);
      component.openGeneralNotes();
    });

    it('should show error for general notes when no collection date', () => {
      component.selectedUnit.set({ unitId: 'U1', collDate: null } as any);
      component.openGeneralNotes();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Collection Date is required to view general notes');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('unit details loading', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle unit details with success false', fakeAsync(() => {
      apiServiceSpy.getUnitDetails.and.returnValue(
        of({ success: false, message: '', statusCode: 400, data: null }),
      );
      component.onRowClick(mockSearchResults[0] as any);
      tick();
      expect(component.unitDetails()).toBeNull();
    }));
  });
});
