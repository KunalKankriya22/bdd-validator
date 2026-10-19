import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';

import { ReleaseUnitSystemInterdictionComponent } from './release-unit-system-interdiction.component';
import { ReleaseUnitSystemInterdictionService } from './services/release-unit-system-interdiction.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitResponseDto,
  UnitSystemInterdictionDto,
  ApiResponse,
} from './models/release-unit-system-interdiction.models';

describe('ReleaseUnitSystemInterdictionComponent', () => {
  let component: ReleaseUnitSystemInterdictionComponent;
  let fixture: ComponentFixture<ReleaseUnitSystemInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseUnitSystemInterdictionService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: 'I1234567890',
    collDate: '2024-01-15T00:00:00Z',
    isValid: true,
    parsedUnitId: 'I1234567890',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'I1234567890',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  const mockInterdictions: UnitSystemInterdictionDto[] = [
    {
      unitId: 'I1234567890',
      collDate: '2024-01-15T00:00:00Z',
      interCode: '0010',
      interDesc: 'Reactive Donor Screening',
      interType: 'N',
      interTypeDesc: 'NFT',
      chapterId: 'DAL',
      insertDate: '2024-01-15T10:00:00Z',
      insertUser: 'TESTUSER',
    },
    {
      unitId: 'I1234567890',
      collDate: '2024-01-15T00:00:00Z',
      interCode: '0020',
      interDesc: 'Equipment Malfunction',
      interType: 'M',
      interTypeDesc: 'Misc',
      chapterId: 'DAL',
      insertDate: '2024-01-15T11:00:00Z',
      insertUser: 'TESTUSER',
    },
  ];

  const mockReleaseResponse: ApiResponse<boolean> = {
    success: true,
    message: 'Released',
    statusCode: 200,
    item: true,
  };

  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ReleaseUnitSystemInterdictionService', [
      'validateUnit',
      'getInterdictions',
      'releaseInterdictions',
    ]);

    snackbarSpy = createMockSnackbarService();

    const headerServiceStub = {
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterId: jasmine.createSpy().and.returnValue('DAL'),
    };

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} }),
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    serviceSpy.validateUnit.and.returnValue(of(mockUnitValidation));
    serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));
    serviceSpy.releaseInterdictions.and.returnValue(of(mockReleaseResponse));



      TestBed.configureTestingModule({
      imports: [ReleaseUnitSystemInterdictionComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        OverlayModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseUnitSystemInterdictionService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: SnackbarService, useValue: snackbarSpy },
        MatDialog,
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });

      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


      serviceSpy.validateUnit.and.returnValue(of(mockUnitValidation));


      serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));


      serviceSpy.releaseInterdictions.and.returnValue(of(mockReleaseResponse));


    fixture = TestBed.createComponent(ReleaseUnitSystemInterdictionComponent);
    component = fixture.componentInstance;

    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    spyOn(dialogSpy, 'open').and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<any>);

    fixture.detectChanges();


    });

  afterEach(() => {
    fixture?.destroy();
  });

  // -- Initialization ------------------------------------------------------

  describe('Initialization', () => {






    it('should configure table with selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBe(true);
      expect(component.tableConfig.selectionKey).toBe('interCode');
      expect(component.tableConfig.columns.length).toBe(3);
    });

  });

  // -- Unit Validation -----------------------------------------------------

  describe('Unit Validation', () => {
    it('should validate unit and load interdictions', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: 'I1234567890', codeScheme: 'I' } as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('I1234567890');
      expect(component.parsedUnitId()).toBe('I1234567890');
      expect(component.codeScheme()).toBe('I');
      expect(component.showEntryForm()).toBe(true);
      expect(component.collectionDate()).toBe('2024-01-15T00:00:00Z');
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith('I1234567890', '2024-01-15T00:00:00Z');
    }));








  });

  // -- Collection Date Selection -------------------------------------------

  describe('Collection Date Selection', () => {
    it('should load interdictions when date is selected', fakeAsync(() => {
      component.parsedUnitId.set('I1234567890');

      component.onCollDateSelected('2024-01-20T00:00:00Z');
      tick();

      expect(component.collectionDate()).toBe('2024-01-20T00:00:00Z');
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith('I1234567890', '2024-01-20T00:00:00Z');
    }));

    it('should reset selection and reload interdictions on date change', fakeAsync(() => {
      component.parsedUnitId.set('I1234567890');
      component.interdictions.set(mockInterdictions);
      component.selectedRows.set([mockInterdictions[0]]);
      component.externalSelectedIds.set(new Set(['0010']));

      component.onCollDateSelected('2024-01-20T00:00:00Z');
      tick();

      expect(component.selectedRows()).toEqual([]);
      expect(component.externalSelectedIds().size).toBe(0);
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith('I1234567890', '2024-01-20T00:00:00Z');
    }));
  });

  // -- Interdictions Loading -----------------------------------------------
  // -- Computed Properties -------------------------------------------------

  describe('Computed Properties', () => {
    it('should compute hasMultipleDates', () => {
      expect(component.hasMultipleDates()).toBe(false);

      component.availableCollectionDates.set(['2024-01-15', '2024-01-20']);
      expect(component.hasMultipleDates()).toBe(true);

      component.availableCollectionDates.set(['2024-01-15']);
      expect(component.hasMultipleDates()).toBe(false);
    });

    it('should compute canRelease', () => {
      expect(component.canRelease()).toBe(false);

      component.selectedRows.set([mockInterdictions[0]]);
      expect(component.canRelease()).toBe(true);

      component.isReleasing.set(true);
      expect(component.canRelease()).toBe(false);
    });
  });

  // -- Selection -----------------------------------------------------------

  describe('Selection', () => {


    it('should clear selectedRows', () => {
      component.selectedRows.set(mockInterdictions);
      component.onSelectionChange([]);
      expect(component.selectedRows()).toEqual([]);
    });


  });

  // -- Release -------------------------------------------------------------

  describe('Release', () => {
    beforeEach(() => {
      component.parsedUnitId.set('I1234567890');
      component.collectionDate.set('2024-01-15T00:00:00Z');
      component.interdictions.set(mockInterdictions);
    });





    it('should execute release with correct request', fakeAsync(() => {
      component.selectedRows.set(mockInterdictions);

      (component as any).executeRelease(mockInterdictions, '2024-01-15T00:00:00Z');
      tick();

      expect(serviceSpy.releaseInterdictions).toHaveBeenCalledWith({
        unitId: 'I1234567890',
        collDate: '2024-01-15T00:00:00Z',
        interCodes: ['0010', '0020'],
      });

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        '2 System interdictions removed successfully',
      );
      expect(component.isReleasing()).toBe(false);
    }));



    it('should handle release API error', fakeAsync(() => {
      serviceSpy.releaseInterdictions.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to release' } })),
      );

      (component as any).executeRelease([mockInterdictions[0]], '2024-01-15T00:00:00Z');
      tick();

      expect(component.isReleasing()).toBe(false);
    }));

    it('should handle unsuccessful release response', fakeAsync(() => {
      serviceSpy.releaseInterdictions.and.returnValue(of({
        success: false,
        message: 'Release failed',
        statusCode: 400,
        item: false,
      }));

      (component as any).executeRelease([mockInterdictions[0]], '2024-01-15T00:00:00Z');
      tick();

      expect(component.isReleasing()).toBe(false);
      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    }));
  });

  // -- State Management ----------------------------------------------------

  describe('State Management', () => {
    it('should reset state on unit cleared', () => {
      component.parsedUnitId.set('I1234567890');
      component.collectionDate.set('2024-01-15T00:00:00Z');
      component.interdictions.set(mockInterdictions);
      component.showEntryForm.set(true);
      component.hasLoadedInterdictions.set(true);

      component.onUnitCleared();

      expect(component.parsedUnitId()).toBe('');
      expect(component.collectionDate()).toBe('');
      expect(component.interdictions()).toEqual([]);
      expect(component.showEntryForm()).toBe(false);
      expect(component.hasLoadedInterdictions()).toBe(false);
    });



    it('should reset all on clearAll', () => {
      component.parsedUnitId.set('I1234567890');
      component.showEntryForm.set(true);
      component.interdictions.set(mockInterdictions);

      component.clearAll();

      expect(component.parsedUnitId()).toBe('');
      expect(component.showEntryForm()).toBe(false);
      expect(component.interdictions()).toEqual([]);
    });
  });

  // -- Date Formatting -----------------------------------------------------

  describe('Date Formatting', () => {
    it('should format ISO date', () => {
      expect(component.formatDate('2024-01-15T00:00:00Z')).toBe('15-JAN-2024');
    });








  });

  // -- Cleanup -------------------------------------------------------------
});
