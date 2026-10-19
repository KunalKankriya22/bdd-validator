import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { SeparationTimesComponent } from './separation-times';
import { SeparationTimesService } from './services/separation-times.service';
import {
  CentrifugeDto,
  RecordSeparationResponseDto,
  SeparationTimeDisplay
} from './models/separation-times.model';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('SeparationTimesComponent', () => {
  let entries: any;
  let serviceSpy: any;
  let component: SeparationTimesComponent;
  let fixture: ComponentFixture<SeparationTimesComponent>;
  let separationService: jasmine.SpyObj<SeparationTimesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  const mockCentrifuges: CentrifugeDto[] = [
    { equipId: 'BO1', description: 'Centrifuge BO1' },
    { equipId: 'BO2', description: 'Centrifuge BO2' }
  ];

  const mockSeparationResponse: RecordSeparationResponseDto = {
    unitId: 'W1234-18-031310-Z',
    collDate: '2025-01-10T00:00:00',
    bleedStartTime: '2025-01-11T13:16:00',
    firstSepTime: '2025-01-11T17:07:00',
    secondSepTime: '',
    firstSepCentrifugeId: 'BO1',
    secondSepCentrifugeId: '',
    firstSepDuration: '003:51',
    secondSepDuration: ''
  };

  const createMockEntry = (overrides: Partial<SeparationTimeDisplay> = {}): SeparationTimeDisplay => ({
    unitId: 'W1234-18-031310-Z',
    collectionDate: '10-JAN-2025',
    centrifugeId: 'BO1',
    bleedStartTime: '11-JAN-2025 13:16',
    firstSeparationTime: '003:51',
    secondSeparationTime: '-',
    firstSepDuration: '003:51',
    secondSepDuration: '',
    separationRecorded: 'FIRST',
    ...overrides
  });

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('SeparationTimesService', [
      'getCentrifuges',
      'recordSeparation'
    ]);
    const snackBarSpy = createMockMatSnackBar();

    chapterChanged$ = new Subject<void>();
    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterTimezone: jasmine.createSpy('getCurrentChapterTimezone').and.returnValue('EST')
    } as any;

    const pageHeaderServiceMock = {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Separation Times',
        subtitle: 'Record the first and second plasma separation time.'
      })
    } as any;



      TestBed.configureTestingModule({
      imports: [
        SeparationTimesComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: SeparationTimesService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });

    separationService = TestBed.inject(SeparationTimesService) as jasmine.SpyObj<SeparationTimesService>;

    separationService.getCentrifuges.and.returnValue(of(mockCentrifuges));
    separationService.recordSeparation.and.returnValue(of(mockSeparationResponse));

    fixture = TestBed.createComponent(SeparationTimesComponent);
    component = fixture.componentInstance;

    snackBar = component['snackBar'] as jasmine.SpyObj<MatSnackBar>;
    spyOn(snackBar, 'open');

    fixture.detectChanges();

    component['unitIdField'] = jasmine.createSpyObj('UnitIdFieldComponent', ['clear']);


    });


  it('should generate unique component ID', () => {
    const fixture2 = TestBed.createComponent(SeparationTimesComponent);
    const component2 = fixture2.componentInstance;

    expect(component['componentId']).toContain('separation-times-');
    expect(component2['componentId']).toContain('separation-times-');
    expect(component['componentId']).not.toEqual(component2['componentId']);
  });

  describe('Initialization', () => {
    it('should load centrifuges on init', () => {
      expect(separationService.getCentrifuges).toHaveBeenCalled();
      expect(component['centrifuges']()).toEqual(mockCentrifuges);
    });



    it('should not show scan entry row initially', () => {
      expect(component['scanEntryVisible']()).toBeFalse();
    });

    it('should have empty scanned entries initially', () => {
      expect(component['scannedEntries']().length).toBe(0);
    });

    it('should have saved count at 0 initially', () => {
      expect(component['savedCount']()).toBe(0);
    });

    it('should initialize chapter timezone', () => {
      expect(component['chapterTimezone']()).toBe('EST');
    });
  });

  describe('Centrifuge Selection', () => {
    it('should show scan entry row after centrifuge is selected', () => {
      component['onCentrifugeSelected']('BO1');
      expect(component['scanEntryVisible']()).toBeTrue();
      expect(component['selectedCentrifuge']()).toBe('BO1');
    });

    it('should set row centrifuge control when centrifuge is selected', () => {
      component['onCentrifugeSelected']('BO1');
      expect(component['rowCentrifugeControl'].value).toBe('BO1');
    });

    it('should reset state when centrifuge changes', () => {
      component['onCentrifugeSelected']('BO1');
      component['scannedEntries'].set([createMockEntry()]);
      component['savedCount'].set(5);

      component['onCentrifugeSelected']('BO2');

      expect(component['selectedCentrifuge']()).toBe('BO2');
      expect(component['scannedEntries']().length).toBe(0);
      expect(component['savedCount']()).toBe(0);
      expect(component['currentScanEntry']()).toBeNull();
    });
  });

  describe('Unit Validation', () => {
    beforeEach(() => {
      component['onCentrifugeSelected']('BO1');
    });

    it('should call recordSeparation on valid unit scan', () => {
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;
      component['onUnitValidated'](mockValidation);

      expect(separationService.recordSeparation).toHaveBeenCalledWith({
        unitId: 'W1234-18-031310-Z',
        centrifugeId: 'BO1'
      });
    });

    it('should use row centrifuge control value for centrifuge ID', () => {
      component['rowCentrifugeControl'].setValue('BO2');
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;
      component['onUnitValidated'](mockValidation);

      expect(separationService.recordSeparation).toHaveBeenCalledWith({
        unitId: 'W1234-18-031310-Z',
        centrifugeId: 'BO2'
      });
    });



    it('should update scanned entries on success', fakeAsync(() => {
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;
      component['onUnitValidated'](mockValidation);
      tick();

      entries = component['scannedEntries']();
      expect(entries.length).toBe(1);
      expect(entries[0].collectionDate).toBe('10-JAN-2025');
      expect(entries[0].firstSeparationTime).toBe('003:51');
      expect(entries[0].centrifugeId).toBe('BO1');
    }));



    it('should increment saved count and show snackbar on success', fakeAsync(() => {
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;
      component['onUnitValidated'](mockValidation);
      tick();

      expect(component['savedCount']()).toBe(1);
      expect(snackBar.open).toHaveBeenCalledWith(
        '1 Entry saved',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    }));




  });

  describe('Duplicate Detection', () => {
    beforeEach(() => {
      component['onCentrifugeSelected']('BO1');
    });

    it('should show inline error for duplicate unit ID', fakeAsync(() => {
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;

      component['onUnitValidated'](mockValidation);
      tick();

      separationService.recordSeparation.calls.reset();
      component['onUnitValidated'](mockValidation);

      expect(component['duplicateError']()).toBe('This Unit ID has already scanned');
      expect(separationService.recordSeparation).not.toHaveBeenCalled();
    }));

    it('should clear duplicate error when unit is cleared', () => {
      component['duplicateError'].set('This Unit ID has already scanned');
      component['onUnitCleared']();
      expect(component['duplicateError']()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component['onCentrifugeSelected']('BO1');
    });





    it('should reset processing state on error', fakeAsync(() => {
      separationService.recordSeparation.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      const mockValidation = { parsedUnitId: 'INVALID-UNIT' } as any;
      component['onUnitValidated'](mockValidation);
      tick();

      expect(component['isProcessing']()).toBeFalse();
    }));
  });

  describe('Clear All', () => {
    beforeEach(() => {
      component['onCentrifugeSelected']('BO1');
    });

    it('should clear all entries and reset state', fakeAsync(() => {
      const mockValidation = { parsedUnitId: 'W1234-18-031310-Z' } as any;
      component['onUnitValidated'](mockValidation);
      tick();

      expect(component['scannedEntries']().length).toBe(1);
      expect(component['savedCount']()).toBe(1);

      component['onClearAll']();

      expect(component['scannedEntries']().length).toBe(0);
      expect(component['savedCount']()).toBe(0);
      expect(component['currentScanEntry']()).toBeNull();
      expect(component['duplicateError']()).toBeNull();
      expect(component['currentPage']).toBe(0);
    }));


  });


  describe('Displayed Columns', () => {
    it('should include all expected columns', () => {
      const columns = component['displayedColumns'];
      expect(columns).toContain('unitId');
      expect(columns).toContain('collectionDate');
      expect(columns).toContain('centrifugeId');
      expect(columns).toContain('bleedStartTime');
      expect(columns).toContain('firstSeparationTime');
      expect(columns).toContain('secondSeparationTime');
      expect(columns.length).toBe(6);
    });
  });

  describe('Chapter Change', () => {
    it('should reset all state on chapter change', fakeAsync(() => {
      component['onCentrifugeSelected']('BO1');
      component['scannedEntries'].set([createMockEntry()]);
      component['savedCount'].set(5);

      chapterChanged$.next();
      tick();

      expect(component['selectedCentrifuge']()).toBeNull();
      expect(component['scannedEntries']().length).toBe(0);
      expect(component['savedCount']()).toBe(0);
      expect(component['currentScanEntry']()).toBeNull();
      expect(component['duplicateError']()).toBeNull();
    }));



    it('should reset centrifuge controls on chapter change', fakeAsync(() => {
      component['onCentrifugeSelected']('BO1');
      chapterChanged$.next();
      tick();

      expect(component['centrifugeControl'].value).toBeNull();
      expect(component['rowCentrifugeControl'].value).toBeNull();
    }));
  });

  describe('Accessibility', () => {




    it('should generate unique label IDs', () => {
      const labelId = component['labelId']('centrifuge');
      expect(labelId).toContain('-centrifuge-label');
    });
  });
});
