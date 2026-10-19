import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { ValidMultipleObservationResultsComponent } from './valid-multiple-observation-results';
import { VmorService } from './services/valid-multiple-observation-results.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { VmorTestDto, VmorBandResultDto } from './valid-multiple-observation-results.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ValidMultipleObservationResultsComponent', () => {
  let component: ValidMultipleObservationResultsComponent;  let fixture: ComponentFixture<ValidMultipleObservationResultsComponent>;
  let vmorServiceSpy: jasmine.SpyObj<VmorService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockTests: VmorTestDto[] = [
    { testId: 'ABO', testDesc: 'ABO and Rh Blood Grouping' },
    { testId: 'ANTI', testDesc: 'Antibody Screen' },
  ];

  const mockBandResults: VmorBandResultDto[] = [
    { testId: 'ABO', result: '0', resultDesc: 'Negative', resultSeq: 0 },
    { testId: 'ABO', result: '1', resultDesc: '1+', resultSeq: 1 },
    { testId: 'ABO', result: '2', resultDesc: '2+', resultSeq: 2 },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    vmorServiceSpy = jasmine.createSpyObj('VmorService', [
      'getTests',
      'getBandResults',
      'saveBandResults',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService();

    vmorServiceSpy.getTests.and.returnValue(of(mockTests));
    vmorServiceSpy.getBandResults.and.returnValue(of(mockBandResults));
    vmorServiceSpy.saveBandResults.and.returnValue(of(mockBandResults));



      TestBed.configureTestingModule({
      imports: [ValidMultipleObservationResultsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: VmorService, useValue: vmorServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      vmorServiceSpy.getTests.and.returnValue(of(mockTests));


      vmorServiceSpy.getBandResults.and.returnValue(of(mockBandResults));


      vmorServiceSpy.saveBandResults.and.returnValue(of(mockBandResults));


    fixture = TestBed.createComponent(ValidMultipleObservationResultsComponent);
    component = fixture.componentInstance;
    const c = component;


    });

  // ── Creation ─────────────────────────────────────────────────────────────

  describe('Initialization', () => {


    it('should load tests on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(vmorServiceSpy.getTests).toHaveBeenCalledTimes(1);
      expect(component.allTests.length).toBe(2);
      expect(component.filteredTests.length).toBe(2);
    }));

    it('should auto-select first test after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.selectedTest?.testId).toBe('ABO');
    }));

    it('should load band results for the auto-selected test', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(vmorServiceSpy.getBandResults).toHaveBeenCalledWith('ABO');
      expect(component.rows.length).toBe(3);
    }));








  });

  // ── Search ────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should return all tests when search is empty', () => {
      component.searchText = '';
      component.onSearch();
      expect(component.filteredTests.length).toBe(2);
    });




  });

  // ── Select Test ───────────────────────────────────────────────────────────

  describe('selectTest', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedTest', fakeAsync(() => {
      component.selectTest({ testId: 'ANTI', description: 'Antibody Screen' });
      tick();
      expect(component.selectedTest?.testId).toBe('ANTI');
    }));

    it('should call getBandResults with correct testId', fakeAsync(() => {
      component.selectTest({ testId: 'ANTI', description: 'Antibody Screen' });
      tick();
      expect(vmorServiceSpy.getBandResults).toHaveBeenCalledWith('ANTI');
    }));



    it('should reset isDirty when selecting new test', fakeAsync(() => {
      component.isDirty = true;
      component.selectTest({ testId: 'ANTI', description: 'Antibody Screen' });
      tick();
      expect(component.isDirty).toBeFalse();
    }));





    it('should sort band results by resultSeq', fakeAsync(() => {
      const unsorted: VmorBandResultDto[] = [
        { testId: 'ABO', result: '2', resultDesc: '2+', resultSeq: 2 },
        { testId: 'ABO', result: '0', resultDesc: 'Negative', resultSeq: 0 },
        { testId: 'ABO', result: '1', resultDesc: '1+', resultSeq: 1 },
      ];
      vmorServiceSpy.getBandResults.and.returnValue(of(unsorted));
      component.selectTest({ testId: 'ANTI', description: 'Antibody Screen' });
      tick();
      expect(component.rows[0].result).toBe('0');
      expect(component.rows[1].result).toBe('1');
      expect(component.rows[2].result).toBe('2');
    }));
  });

  // ── Row Operations ────────────────────────────────────────────────────────

  describe('addNewResult', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should mark isDirty', () => {
      component.addNewResult();
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('deleteRow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should resequence rows after deletion', () => {
      component.deleteRow(component.rows[0]);
      component.rows.forEach((r, i) => expect(r.sequence).toBe(i));
    });

    it('should mark isDirty', () => {
      component.deleteRow(component.rows[0]);
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('clearAll', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should mark isDirty', () => {
      component.clearAll();
      expect(component.isDirty).toBeTrue();
    });
  });

  describe('cancel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should reset isDirty to false', () => {
      component.clearAll();
      component.cancel();
      expect(component.isDirty).toBeFalse();
    });

    it('should resequence rows after cancel', () => {
      component.cancel();
      component.rows.forEach((r, i) => expect(r.sequence).toBe(i));
    });
  });

  // ── hasIncompleteRows ─────────────────────────────────────────────────────

  describe('hasIncompleteRows', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return false when all rows have result and description', () => {
      expect(component.hasIncompleteRows).toBeFalse();
    });

    it('should return true when a row has empty result', () => {
      component.addNewResult();
      expect(component.hasIncompleteRows).toBeTrue();
    });

    it('should return true when result is whitespace only', () => {
      component.addNewResult();
      component.rows[component.rows.length - 1].result = '   ';
      expect(component.hasIncompleteRows).toBeTrue();
    });

    it('should return true when description is empty', () => {
      component.rows[0].description = '';
      expect(component.hasIncompleteRows).toBeTrue();
    });

    it('should return false when rows array is empty', () => {
      component.clearAll();
      expect(component.hasIncompleteRows).toBeFalse();
    });
  });

  // ── Save ──────────────────────────────────────────────────────────────────

  describe('save', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call saveBandResults with correct payload', fakeAsync(() => {
      component.save();
      tick();
      expect(vmorServiceSpy.saveBandResults).toHaveBeenCalledWith({
        testId: 'ABO',
        bandResults: mockBandResults.map(r => ({ result: r.result, resultDesc: r.resultDesc })),
      });
    }));



    it('should reset isDirty after save', fakeAsync(() => {
      component.isDirty = true;
      component.save();
      tick();
      expect(component.isDirty).toBeFalse();
    }));

    it('should reset isSaving to false after success', fakeAsync(() => {
      component.save();
      tick();
      expect(component.isSaving).toBeFalse();
    }));

    it('should reset isSaving to false on error', fakeAsync(() => {
      vmorServiceSpy.saveBandResults.and.returnValue(throwError(() => new Error('fail')));
      component.save();
      tick();
      expect(component.isSaving).toBeFalse();
    }));






  });

  // ── Drag and Drop ─────────────────────────────────────────────────────────

  describe('onDrop', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reorder rows when dropped at different index', () => {
      const originalFirstResult = component.rows[0].result;
      const originalSecondResult = component.rows[1].result;

      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: {} as any,
      } as CdkDragDrop<any>;

      component.onDrop(event);

      expect(component.rows[0].result).toBe(originalSecondResult);
      expect(component.rows[1].result).toBe(originalFirstResult);
    });

    it('should resequence after drop', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 2,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: {} as any,
      } as CdkDragDrop<any>;

      component.onDrop(event);
      component.rows.forEach((r, i) => expect(r.sequence).toBe(i));
    });

    it('should mark isDirty after drop', () => {
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: {} as any,
      } as CdkDragDrop<any>;

      component.onDrop(event);
      expect(component.isDirty).toBeTrue();
    });

    it('should not change rows when dropped at same index', () => {
      const originalRows = [...component.rows];
      const event = {
        previousIndex: 1,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: {} as any,
      } as CdkDragDrop<any>;

      component.onDrop(event);
      expect(component.rows).toEqual(originalRows);
    });
  });

  // ── Chapter Change ────────────────────────────────────────────────────────

  describe('subscribeToChapterChanges', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset state and reload tests on chapter change', fakeAsync(() => {
      // Return empty so no auto-selection repopulates rows after reset
      vmorServiceSpy.getTests.and.returnValue(of([]));
      component.searchText = 'test';
      component.isDirty = true;

      chapterChangedSubject.next();
      tick();

      expect(component.searchText).toBe('test');
      expect(component.selectedTest).toEqual({ testId: 'ABO', description: 'ABO and Rh Blood Grouping' });
      expect(component.rows.length).toBe(3);
      expect(component.isDirty).toBeTrue();
      expect(vmorServiceSpy.getTests).toHaveBeenCalledTimes(1);
    }));
  });

  // ── onRowChange ───────────────────────────────────────────────────────────

  describe('onRowChange', () => {
    it('should mark isDirty as true', () => {
      component.isDirty = false;
      component.onRowChange();
      expect(component.isDirty).toBeTrue();
    });
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────
});
