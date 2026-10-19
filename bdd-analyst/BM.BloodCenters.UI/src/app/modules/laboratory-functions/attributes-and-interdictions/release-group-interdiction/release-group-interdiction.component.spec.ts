import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';

import { ReleaseGroupInterdictionComponent } from './release-group-interdiction.component';
import { ReleaseGroupInterdictionService } from './services/release-group-interdiction.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';
import {
  ReleaseGroupInterdictionDto,
  SEARCH_MODE_TO_SOURCE_TEST_ID,
} from './models/release-group-interdiction.models';

describe('ReleaseGroupInterdictionComponent', () => {
  let component: ReleaseGroupInterdictionComponent;
  let fixture: ComponentFixture<ReleaseGroupInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseGroupInterdictionService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockInterdictions: ReleaseGroupInterdictionDto[] = [
    {
      unitId: 'W334826061101',
      collDate: '2026-01-10T00:00:00',
      chapterId: 'OBK',
      interCode: 'ABOD',
      interDesc: 'ABO/Rh Donor Discrepancy',
      interType: 'HOLD',
      sourceTestId: 'BATCH',
      effDate: '1998-06-01T00:00:00',
      termDate: '2026-06-30T00:00:00',
      driveId: null,
      batchId: '061126-IM1006',
      lotNumber: null,
    },
    {
      unitId: 'W334826061102',
      collDate: '2026-01-10T00:00:00',
      chapterId: 'OBK',
      interCode: 'ABOD',
      interDesc: 'ABO/Rh Donor Discrepancy',
      interType: 'HOLD',
      sourceTestId: 'BATCH',
      effDate: '1998-06-01T00:00:00',
      termDate: '2026-06-30T00:00:00',
      driveId: null,
      batchId: '061126-IM1006',
      lotNumber: null,
    },
    {
      unitId: 'W334826061103',
      collDate: '2026-01-10T00:00:00',
      chapterId: 'OBK',
      interCode: 'NFT1',
      interDesc: 'Not For Transfusion',
      interType: 'NFT',
      sourceTestId: 'BATCH',
      effDate: '1998-06-01T00:00:00',
      termDate: null,
      driveId: null,
      batchId: '061126-IM1006',
      lotNumber: null,
    },
  ];

  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ReleaseGroupInterdictionService', [
      'getAll',
      'deleteInterdictions',
      'getUnitsInfo',
      'getDrivesDropdown',
      'getBatchesDropdown',
      'getCollectionDatesDropdown',
      'getLotNumbersDropdown',
      'getTbIdsDropdown',
    ]);

    snackbarSpy = createMockSnackbarService();

    dialogSpy = createMockMatDialog();
    dialogSpy.open.and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<any>);

    const headerServiceStub = {
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterId: jasmine.createSpy().and.returnValue('OBK'),
    };

    const chapterTimezoneStub = {
      convertGmtToLocal: jasmine.createSpy().and.callFake((m: any) => m),
      chapterLocalDate: jasmine.createSpy().and.returnValue(null),
    };

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} }),
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    serviceSpy.getAll.and.returnValue(of({ data: mockInterdictions, totalCount: 3 }));
    serviceSpy.deleteInterdictions.and.returnValue(of({ success: true, message: 'Deleted' }));
    serviceSpy.getUnitsInfo.and.returnValue(of([]));
    serviceSpy.getDrivesDropdown.and.returnValue(of([{ driveId: 'D001' }]));
    serviceSpy.getBatchesDropdown.and.returnValue(of([{ batchId: '061126-IM1006' }]));
    serviceSpy.getCollectionDatesDropdown.and.returnValue(of([{ collDate: '2026-01-10T00:00:00' }]));
    serviceSpy.getLotNumbersDropdown.and.returnValue(of([{ lotNumber: 'LOT001' }]));
    serviceSpy.getTbIdsDropdown.and.returnValue(of([{ tbId: 'TB001' }]));



      TestBed.configureTestingModule({
      imports: [ReleaseGroupInterdictionComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        OverlayModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseGroupInterdictionService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneStub },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });

      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


      serviceSpy.getAll.and.returnValue(of({ data: mockInterdictions, totalCount: 3 }));


      serviceSpy.deleteInterdictions.and.returnValue(of({ success: true, message: 'Deleted' }));


      serviceSpy.getUnitsInfo.and.returnValue(of([]));


      serviceSpy.getDrivesDropdown.and.returnValue(of([{ driveId: 'D001' }]));


      serviceSpy.getBatchesDropdown.and.returnValue(of([{ batchId: '061126-IM1006' }]));


      serviceSpy.getCollectionDatesDropdown.and.returnValue(of([{ collDate: '2026-01-10T00:00:00' }]));


      serviceSpy.getLotNumbersDropdown.and.returnValue(of([{ lotNumber: 'LOT001' }]));


      serviceSpy.getTbIdsDropdown.and.returnValue(of([{ tbId: 'TB001' }]));


    fixture = TestBed.createComponent(ReleaseGroupInterdictionComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();


    });

  afterEach(() => {
    fixture?.destroy();
  });

  // ── Initialization ────────────────────────────────────────────────────────────

  describe('Initialization', () => {








    it('should load drives dropdown on init', () => {
      expect(serviceSpy.getDrivesDropdown).toHaveBeenCalledWith('DRIVE');
    });

    it('should initialize with empty results', () => {
      expect(component.interdictions().length).toBe(0);
      expect(component.hasSearched()).toBe(false);
      expect(component.isLoading()).toBe(false);
    });
  });

  // ── Source Test ID Mapping ────────────────────────────────────────────────────

  describe('Source Test ID Mapping', () => {
    it('should map DRIVE mode to DRIVE sourceTestId', () => {
      component.searchMode.set('DRIVE');
      expect(component.currentSourceTestId()).toBe('DRIVE');
    });

    it('should map BATCH mode to BATCH sourceTestId', () => {
      component.searchMode.set('BATCH');
      expect(component.currentSourceTestId()).toBe('BATCH');
    });

    it('should map COLL_DATE mode to COLL DATE sourceTestId', () => {
      component.searchMode.set('COLL_DATE');
      expect(component.currentSourceTestId()).toBe('COLL DATE');
    });

    it('should map LOT mode to LOT sourceTestId', () => {
      component.searchMode.set('LOT');
      expect(component.currentSourceTestId()).toBe('LOT');
    });

    it('should map TB_ID mode to TBID sourceTestId', () => {
      component.searchMode.set('TB_ID');
      expect(component.currentSourceTestId()).toBe('TBID');
    });

    it('should map ITBID mode to ITBID sourceTestId', () => {
      component.searchMode.set('ITBID');
      expect(component.currentSourceTestId()).toBe('ITBID');
    });
  });

  // ── Mode Switching ────────────────────────────────────────────────────────────

  describe('Mode Switching', () => {
    it('should reset value and results when mode changes', fakeAsync(() => {
      component.searchValueControl.setValue('D001');
      component['allResults'].set(mockInterdictions);
      component.hasSearched.set(true);

      component.onSearchModeChange('BATCH');
      tick();

      expect(component.searchMode()).toBe('BATCH');
      expect(component.searchValueControl.value).toBe('');
      expect(component.interdictions().length).toBe(0);
      expect(component.hasSearched()).toBe(false);
    }));

    it('should load batch dropdown when switching to BATCH', fakeAsync(() => {
      component.onSearchModeChange('BATCH');
      tick();

      expect(serviceSpy.getBatchesDropdown).toHaveBeenCalledWith('BATCH');
    }));

    it('should load collection dates dropdown when switching to COLL_DATE', fakeAsync(() => {
      component.onSearchModeChange('COLL_DATE');
      tick();

      expect(serviceSpy.getCollectionDatesDropdown).toHaveBeenCalledWith('COLL DATE');
    }));

    it('should load lot numbers dropdown when switching to LOT', fakeAsync(() => {
      component.onSearchModeChange('LOT');
      tick();

      expect(serviceSpy.getLotNumbersDropdown).toHaveBeenCalledWith('LOT');
    }));

    it('should load TB IDs dropdown when switching to TB_ID', fakeAsync(() => {
      component.onSearchModeChange('TB_ID');
      tick();

      expect(serviceSpy.getTbIdsDropdown).toHaveBeenCalledWith('TBID');
    }));

    it('should not load dropdown for ITBID mode', fakeAsync(() => {
      component.onSearchModeChange('ITBID');
      tick();

      expect(component.isLoadingDropdown()).toBe(false);
    }));
  });

  // ── Search (getAll) ───────────────────────────────────────────────────────────

  describe('Search', () => {
    it('should not search with empty value', () => {
      component.searchValueControl.setValue('');
      component.onSearch();

      expect(serviceSpy.getAll).not.toHaveBeenCalled();
      expect(component.searchValueControl.touched).toBe(true);
    });

    it('should call getAll with BATCH mode payload', fakeAsync(() => {
      component.searchMode.set('BATCH');
      component.searchValueControl.setValue('061126-IM1006', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'BATCH', batchId: '061126-IM1006' }),
      );
    }));

    it('should call getAll with DRIVE mode payload', fakeAsync(() => {
      component.searchMode.set('DRIVE');
      component.searchValueControl.setValue('D001', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'DRIVE', driveId: 'D001' }),
      );
    }));

    it('should call getAll with COLL_DATE mode payload', fakeAsync(() => {
      component.searchMode.set('COLL_DATE');
      component.searchValueControl.setValue('2026-01-10T00:00:00', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'COLL DATE', collectionDate: '2026-01-10T00:00:00' }),
      );
    }));

    it('should call getAll with LOT mode payload', fakeAsync(() => {
      component.searchMode.set('LOT');
      component.searchValueControl.setValue('LOT001', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'LOT', lotNumber: 'LOT001' }),
      );
    }));

    it('should call getAll with TB_ID mode payload', fakeAsync(() => {
      component.searchMode.set('TB_ID');
      component.searchValueControl.setValue('TB001', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'TBID', tbId: 'TB001' }),
      );
    }));

    it('should call getAll with ITBID mode payload (uppercase)', fakeAsync(() => {
      component.searchMode.set('ITBID');
      component.searchValueControl.setValue('inst001', { emitEvent: false });

      component.onSearch();
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalledWith(
        1000, 0,
        jasmine.objectContaining({ sourceTestId: 'ITBID', tbId: 'INST001' }),
      );
    }));



  });

  // ── Deduplication ─────────────────────────────────────────────────────────────

  describe('Deduplication', () => {
    it('should deduplicate results by interCode for table display', () => {
      component['allResults'].set(mockInterdictions);

      const deduped = component.interdictions();
      expect(deduped.length).toBe(2);
      expect(deduped.map(d => d.interCode)).toEqual(['ABOD', 'NFT1']);
    });


  });

  // ── ITBID Validation ──────────────────────────────────────────────────────────

  describe('ITBID Validation', () => {
    it('should reject ITBID with TB at position 8-9', () => {
      component.searchMode.set('ITBID');
      component.searchValueControl.setValue('1234567TB001', { emitEvent: false });

      component.onSearch();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('must not have \'TB\' at position 8-9'),
      );
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
    });


  });

  // ── Selection ─────────────────────────────────────────────────────────────────

  describe('Selection', () => {


    it('should clear selectedRows', () => {
      component.selectedRows.set(mockInterdictions);
      component.onSelectionChange([]);
      expect(component.selectedRows()).toEqual([]);
    });

    it('should compute canRelease correctly', () => {
      expect(component.canRelease()).toBe(false);

      component.selectedRows.set([mockInterdictions[0]]);
      expect(component.canRelease()).toBe(true);

      component.isReleasing.set(true);
      expect(component.canRelease()).toBe(false);
    });
  });

  // ── Filter Search ─────────────────────────────────────────────────────────────

  describe('Filter Search', () => {


    it('should return all when search term is empty', () => {
      component['allResults'].set(mockInterdictions);
      component.searchTerm.set('');
      expect(component.filteredInterdictions().length).toBe(2);
    });

    it('should update search term via onFilterSearch', () => {
      component.onFilterSearch('ABOD');
      expect(component.searchTerm()).toBe('ABOD');
    });
  });

  // ── Release ───────────────────────────────────────────────────────────────────

  describe('Release', () => {
    let dialogAfterClosed$: Subject<boolean>;

    beforeEach(() => {
      component['allResults'].set(mockInterdictions);
      component.searchValueControl.setValue('061126-IM1006', { emitEvent: false });
      component.searchMode.set('BATCH');

      dialogAfterClosed$ = new Subject<boolean>();
      dialogSpy.open.and.returnValue({
        afterClosed: () => dialogAfterClosed$.asObservable(),
      } as MatDialogRef<any>);
    });



    it('should handle release API error', fakeAsync(() => {
      serviceSpy.deleteInterdictions.and.returnValue(
        throwError(() => ({ error: { message: 'Failed' } })),
      );

      component.selectedRows.set([mockInterdictions[0]]);
      (component as any).executeRelease([mockInterdictions[0]]);
      tick();

      expect(component.isReleasing()).toBe(false);
    }));
  });

  // ── View Units ────────────────────────────────────────────────────────────────
  // ── Clear All ─────────────────────────────────────────────────────────────────

  describe('Clear All', () => {


    it('should reload drives dropdown after clear', fakeAsync(() => {
      component.clearAll();
      tick();

      expect(serviceSpy.getDrivesDropdown).toHaveBeenCalledWith('DRIVE');
    }));
  });

  // ── Chapter Change ────────────────────────────────────────────────────────────
  // ── Date Formatting ───────────────────────────────────────────────────────────

  describe('Date Formatting', () => {






    it('should format valid ISO date', () => {
      const result = component.formatDate('2026-01-10T00:00:00');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });

  // ── Max Length ─────────────────────────────────────────────────────────────────

  describe('Max Length Validation', () => {
    it('should return 6 for DRIVE', () => {
      component.searchMode.set('DRIVE');
      expect(component.searchValueMaxLength()).toBe(6);
    });

    it('should return 14 for BATCH', () => {
      component.searchMode.set('BATCH');
      expect(component.searchValueMaxLength()).toBe(14);
    });

    it('should return 15 for LOT', () => {
      component.searchMode.set('LOT');
      expect(component.searchValueMaxLength()).toBe(15);
    });

    it('should return 15 for TB_ID', () => {
      component.searchMode.set('TB_ID');
      expect(component.searchValueMaxLength()).toBe(15);
    });

    it('should return 15 for ITBID', () => {
      component.searchMode.set('ITBID');
      expect(component.searchValueMaxLength()).toBe(15);
    });
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────────
});
