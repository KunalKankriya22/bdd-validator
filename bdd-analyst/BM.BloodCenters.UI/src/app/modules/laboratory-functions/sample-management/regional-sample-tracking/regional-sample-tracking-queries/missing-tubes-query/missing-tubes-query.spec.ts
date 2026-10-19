import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { MissingTubesQueryComponent } from './missing-tubes-query';
import { MissingTubesQueryApiService } from './services/missing-tubes-query-api.service';
import { BatchOption, MissingTubesQueryResponse } from './models/missing-tubes-query.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('MissingTubesQueryComponent', () => {
  let component: MissingTubesQueryComponent;
  let fixture: ComponentFixture<MissingTubesQueryComponent>;
  let apiServiceSpy: jasmine.SpyObj<MissingTubesQueryApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockContracts = [
    { contractId: 'WBCRG0183', company: 'Blood Center (W1206)' },
    { contractId: 'WBCRG0200', company: 'Hema-Quebec Testing Lab(7513)' },
  ];

  const mockBatches = [
    { batchId: '012123-RG1471', receivedDate: '01-21-23' },
    { batchId: '120424-RG1883', receivedDate: '12-04-24' },
  ];

  const mockMissingReasons = [
    { code: '9', description: 'Short Sample' },
    { code: 'B', description: 'Broken Tube' },
    { code: 'N', description: 'Not Received' },
  ];

  const mockQueryResponse = {
    units: [
      { unitId: 'W120624120401', checkDigit: null, receivedDate: '12-04-24', redTubeFlag: 'Y', redTube2Flag: '*', purpleTubeFlag: '*', serumPlasmaInd: '*' },
      { unitId: 'W120624120402', checkDigit: null, receivedDate: '12-04-24', redTubeFlag: 'Y', redTube2Flag: '*', purpleTubeFlag: '*', serumPlasmaInd: '*' },
    ],
    totalCount: 11,
    totalUnitsInBatch: 11,
    unitsWithMissingTubes: 11,
    contractId: 'WBCRG0183',
    companyName: 'Blood Center (W1206)',
    batchId: '120424-RG1883',
    minTemp: null,
    maxTemp: null,
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('MissingTubesQueryApiService', [
      'getContracts', 'getBatches', 'getMissingReasons', 'query',
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

    apiServiceSpy.getContracts.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockContracts }),
    );
    apiServiceSpy.getBatches.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockBatches }),
    );
    apiServiceSpy.getMissingReasons.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockMissingReasons }),
    );
    apiServiceSpy.query.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockQueryResponse }),
    );



      TestBed.configureTestingModule({
imports: [MissingTubesQueryComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MissingTubesQueryApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });


    });



  beforeEach(() => {
      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);














    fixture = TestBed.createComponent(MissingTubesQueryComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load missing reasons on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getMissingReasons).toHaveBeenCalledTimes(1);
    });


    it('should initialize with dash values for info fields', () => {
      fixture.detectChanges();
      expect(component.description()).toBe('-');
      expect(component.unitsInBatch()).toBe('-');
      expect(component.unitsMissingTubes()).toBe('-');
    });


    it('should populate missing reasons from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.missingReasons().length).toBe(3);
    }));
  });

  describe('Contract Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load batches when contract is selected', fakeAsync(() => {
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();
      expect(apiServiceSpy.getBatches).toHaveBeenCalledWith('WBCRG0183');
    }));

    it('should set description when contract is selected', fakeAsync(() => {
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();
      expect(component.description()).toBe('Blood Center (W1206)');
    }));

    it('should reset batch and info when contract changes', fakeAsync(() => {
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();
      component.filterForm.get('contractId')?.setValue('WBCRG0200');
      tick();
      expect(component.filterForm.get('batchId')?.value).toBe('');
      expect(component.unitsInBatch()).toBe('-');
      expect(component.unitsMissingTubes()).toBe('-');
    }));

  });

  describe('Retrieve (Main Query)', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call query API with correct params', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.query).toHaveBeenCalledWith('WBCRG0183', '120424-RG1883', 10, 0, 'UnitId', 'ASC');
    }));


    it('should populate summary fields from response', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();
      expect(component.unitsInBatch()).toBe('11');
      expect(component.unitsMissingTubes()).toBe('11');
      expect(component.totalRecords).toBe(11);
      expect(component.hasSearched).toBeTrue();
    }));

    it('should update company name from query response', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();
      expect(component.description()).toBe('Blood Center (W1206)');
    }));




    it('should handle pagination', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 11 });
      tick();
      expect(apiServiceSpy.query).toHaveBeenCalledWith('WBCRG0183', '120424-RG1883', 10, 10, 'UnitId', 'ASC');
    }));

  });

  describe('Clear', () => {
    it('should reset all fields and results', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.units = mockQueryResponse.units;
      component.hasSearched = true;
      component.totalRecords = 11;

      component.onClear();

      expect(component.filterForm.get('contractId')?.value).toBe('');
      expect(component.filterForm.get('batchId')?.value).toBe('');
      expect(component.description()).toBe('-');
      expect(component.unitsInBatch()).toBe('-');
      expect(component.unitsMissingTubes()).toBe('-');
      expect(component.units).toEqual([]);
      expect(component.hasSearched).toBeFalse();
      expect(component.totalRecords).toBe(0);
    }));
  });

  describe('Tube Flag Formatting', () => {
    it('should return "Yes" for Y flag', () => {
      expect(component.formatTubeFlag('Y')).toBe('Yes');
    });

    it('should return "*" for N flag', () => {
      expect(component.formatTubeFlag('N')).toBe('*');
    });

    it('should return "*" for * flag', () => {
      expect(component.formatTubeFlag('*')).toBe('*');
    });

    it('should return "*" for null flag', () => {
      expect(component.formatTubeFlag(null)).toBe('*');
    });

  });


  describe('Chapter Changes', () => {
    it('should clear and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ contractId: 'WBCRG0183' });
      component.hasSearched = true;

      apiServiceSpy.getContracts.calls.reset();
      apiServiceSpy.getMissingReasons.calls.reset();
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('contractId')?.value).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(apiServiceSpy.getContracts).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getMissingReasons).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Sort', () => {
    beforeEach(() => fixture.detectChanges());

    it('should sort ascending', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();

      component.onSortChange({ active: 'unitId', direction: 'asc' });
      tick();

      expect(component.sortColumn).toBe('UnitId');
      expect(component.sortOrder).toBe('ASC');
    }));

    it('should sort descending', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();

      component.onSortChange({ active: 'unitId', direction: 'desc' });
      tick();

      expect(component.sortOrder).toBe('DESC');
    }));

    it('should reset to default sort when direction cleared', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();

      component.onSortChange({ active: '', direction: '' });
      tick();

      expect(component.sortColumn).toBe('UnitId');
      expect(component.sortOrder).toBe('ASC');
    }));
  });

  describe('Utility methods', () => {
    beforeEach(() => fixture.detectChanges());

    it('hasAnyFieldValue returns true when contractId set', () => {
      component.filterForm.patchValue({ contractId: 'WBCRG0183' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('hasAnyFieldValue returns false when no values', () => {
      component.filterForm.patchValue({ contractId: '', batchId: '' });
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('isMissing returns true for null', () => {
      expect(component.isMissing(null)).toBeTrue();
    });

    it('isMissing returns true for N', () => {
      expect(component.isMissing('N')).toBeTrue();
    });

    it('isMissing returns false for Y', () => {
      expect(component.isMissing('Y')).toBeFalse();
    });

    it('getTubeFlagTooltip returns empty for Y', () => {
      expect(component.getTubeFlagTooltip('Y')).toBe('');
    });

    it('getTubeFlagTooltip returns empty for null', () => {
      expect(component.getTubeFlagTooltip(null)).toBe('');
    });

    it('getTubeFlagTooltip returns description for matching code', fakeAsync(() => {
      tick();
      expect(component.getTubeFlagTooltip('9')).toBe('Short Sample');
    }));

    it('getTubeFlagTooltip returns empty for unknown code', fakeAsync(() => {
      tick();
      expect(component.getTubeFlagTooltip('Z')).toBe('');
    }));

    it('formatTubeFlag returns code value for non-standard flag', () => {
      expect(component.formatTubeFlag('9')).toBe('9');
    });
  });

  describe('Retrieve edge cases', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not call query when form is invalid', fakeAsync(() => {
      component.filterForm.patchValue({ contractId: '', batchId: '' });
      component.onRetrieve();
      tick();

      expect(apiServiceSpy.query).not.toHaveBeenCalled();
    }));

    it('should handle query API error', fakeAsync(() => {
      apiServiceSpy.query.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();

      expect(component.units).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle unsuccessful query response', fakeAsync(() => {
      apiServiceSpy.query.and.returnValue(
        of({ success: false, message: 'No data', statusCode: 200, data: null })
      );
      component.filterForm.patchValue({ contractId: 'WBCRG0183', batchId: '120424-RG1883' });
      component.onRetrieve();
      tick();

      expect(component.units).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Batch loading', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle batch loading error', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle unsuccessful batch response', fakeAsync(() => {
      apiServiceSpy.getBatches.and.returnValue(
        of({ success: false, message: 'Error', statusCode: 500, data: null, errorCode: 'E01', errorResponse: { error: 'Batch error' } })
      );
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Batch error');
    }));
  });

  describe('Dropdown search filtering', () => {
    beforeEach(() => fixture.detectChanges());

    it('should filter contracts by search term', fakeAsync(() => {
      component.contractSearchCtrl.setValue('Hema');
      tick();

      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('WBCRG0200');
    }));

    it('should filter batches by search term', fakeAsync(() => {
      component.filterForm.get('contractId')?.setValue('WBCRG0183');
      tick();

      component.batchSearchCtrl.setValue('012123');
      tick();

      const filtered = component.filteredBatches();
      expect(filtered.length).toBe(1);
      expect(filtered[0].batchId).toBe('012123-RG1471');
    }));
  });

  describe('UI Styling - Gap Fix MLT-13106', () => {
    beforeEach(() => fixture.detectChanges());

    it('should apply contract field width modifier class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const contractField = compiled.querySelector('.missing-tubes-query__retrieve-field--contract');
      expect(contractField).toBeTruthy();
    });
  });
});
