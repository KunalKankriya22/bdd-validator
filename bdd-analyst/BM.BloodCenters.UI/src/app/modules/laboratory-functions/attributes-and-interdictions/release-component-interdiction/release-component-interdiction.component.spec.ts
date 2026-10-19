import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';

import { ReleaseComponentInterdictionComponent } from './release-component-interdiction.component';
import { ReleaseComponentInterdictionService } from './services/release-component-interdiction.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentInterdictionDto,
  ApiResponse,
} from './models/release-component-interdiction.models';

describe('ReleaseComponentInterdictionComponent', () => {
  let component: ReleaseComponentInterdictionComponent;
  let fixture: ComponentFixture<ReleaseComponentInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseComponentInterdictionService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: 'I1234567890',
    collDate: '2024-01-15T00:00:00Z',
    availableCollectionDates: ['2024-01-15T00:00:00Z'],
    isValid: true,
  };

  const mockProducts: ValidProductDto[] = [
    { productCode: 'E0791', productDesc: 'Red Blood Cells Leukoreduced' },
    { productCode: 'E0370', productDesc: 'Platelets Apheresis' },
  ];

  const mockInterdictions: ComponentInterdictionDto[] = [
    {
      unitId: 'I1234567890',
      collDate: '2024-01-15T00:00:00Z',
      chapterId: 'DAL',
      productCode: 'E0791',
      interCode: '0010',
      interDesc: 'Reactive Donor Screening',
      interType: 'N',
      interTypeDesc: 'NFT',
      insertDate: '2024-01-15T10:00:00Z',
      insertUser: 'TESTUSER',
    },
    {
      unitId: 'I1234567890',
      collDate: '2024-01-15T00:00:00Z',
      chapterId: 'DAL',
      productCode: 'E0791',
      interCode: '0020',
      interDesc: 'Equipment Malfunction',
      interType: 'M',
      interTypeDesc: 'Misc',
      insertDate: '2024-01-15T11:00:00Z',
      insertUser: 'TESTUSER',
    },
  ];

  const mockReleaseResponse: ApiResponse<{ deletedCount: number }> = {
    success: true,
    message: 'Released',
    statusCode: 200,
    item: { deletedCount: 2 },
  };

  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ReleaseComponentInterdictionService', [
      'validateUnit',
      'getValidProducts',
      'getInterdictions',
      'releaseInterdictions',
    ]);

    snackbarSpy = createMockSnackbarService();

    // dialogSpy is set after TestBed.createComponent

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
    serviceSpy.getValidProducts.and.returnValue(of(mockProducts));
    serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));
    serviceSpy.releaseInterdictions.and.returnValue(of(mockReleaseResponse));



      TestBed.configureTestingModule({
      imports: [ReleaseComponentInterdictionComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        OverlayModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseComponentInterdictionService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: SnackbarService, useValue: snackbarSpy },
        MatDialog,
        { provide: TranslateService, useValue: mockTranslateService },
      ],
    });

      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


      serviceSpy.validateUnit.and.returnValue(of(mockUnitValidation));


      serviceSpy.getValidProducts.and.returnValue(of(mockProducts));


      serviceSpy.getInterdictions.and.returnValue(of(mockInterdictions));


      serviceSpy.releaseInterdictions.and.returnValue(of(mockReleaseResponse));


    fixture = TestBed.createComponent(ReleaseComponentInterdictionComponent);
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

  // ── Initialization ────────────────────────────────────────────────────────────

  describe('Initialization', () => {






    it('should configure table with selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBe(true);
      expect(component.tableConfig.selectionKey).toBe('interCode');
      expect(component.tableConfig.columns.length).toBe(3);
    });

    it('should configure search bar for enter-only', () => {
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    });
  });

  // ── Unit Validation ───────────────────────────────────────────────────────────

  describe('Unit Validation', () => {
    it('should validate unit and auto-load products for single collection date', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: 'I1234567890', codeScheme: 'I' } as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('I1234567890');
      expect(component.parsedUnitId()).toBe('I1234567890');
      expect(component.codeScheme()).toBe('I');
      expect(component.showEntryForm()).toBe(true);
      expect(component.collectionDate()).toBe('2024-01-15T00:00:00Z');
      expect(serviceSpy.getValidProducts).toHaveBeenCalledWith('I1234567890', '2024-01-15T00:00:00Z', 'I');
      expect(component.productCodes()).toEqual(mockProducts);
    }));

    it('should show collection date dropdown for multiple dates', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({
        ...mockUnitValidation,
        availableCollectionDates: ['2024-01-15T00:00:00Z', '2024-01-20T00:00:00Z'],
      }));

      component.onUnitValidated({ parsedUnitId: 'I1234567890', codeScheme: 'I' } as any);
      tick();

      expect(component.availableCollectionDates().length).toBe(2);
      expect(component.hasMultipleDates()).toBe(true);
      expect(serviceSpy.getValidProducts).not.toHaveBeenCalled();
    }));



    it('should handle validation API error and clear unit field', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } })),
      );

      component.onUnitValidated({ parsedUnitId: 'INVALID', codeScheme: 'C' } as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('INVALID');
    }));
  });

  // ── Collection Date Selection ─────────────────────────────────────────────────

  describe('Collection Date Selection', () => {
    it('should load products when date is selected', fakeAsync(() => {
      component.parsedUnitId.set('I1234567890');
      component.codeScheme.set('I');

      component.onCollDateSelected('2024-01-20T00:00:00Z');
      tick();

      expect(component.collectionDate()).toBe('2024-01-20T00:00:00Z');
      expect(serviceSpy.getValidProducts).toHaveBeenCalledWith('I1234567890', '2024-01-20T00:00:00Z', 'I');
    }));

    it('should reset product and interdiction state on date change', fakeAsync(() => {
      component.parsedUnitId.set('I1234567890');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0791');
      component.interdictions.set(mockInterdictions);
      component.selectedRows.set([mockInterdictions[0]]);

      component.onCollDateSelected('2024-01-20T00:00:00Z');
      tick();

      expect(component.selectedProductCode()).toBeNull();
      expect(component.interdictions()).toEqual([]);
      expect(component.selectedRows()).toEqual([]);
    }));
  });

  // ── Product Selection ─────────────────────────────────────────────────────────

  describe('Product Selection', () => {
    beforeEach(() => {
      component.parsedUnitId.set('I1234567890');
      component.collectionDate.set('2024-01-15T00:00:00Z');
      component.codeScheme.set('I');
      component.productCodes.set(mockProducts);
    });

    it('should load interdictions when product is selected', fakeAsync(() => {
      component.productCodeControl.setValue('E0791');
      tick();

      expect(component.selectedProductCode()).toBe('E0791');
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'I1234567890', '2024-01-15T00:00:00Z', 'E0791', 'I',
      );
      expect(component.interdictions()).toEqual(mockInterdictions);
    }));





    it('should handle product load error', fakeAsync(() => {
      serviceSpy.getValidProducts.and.returnValue(
        throwError(() => ({ error: { message: 'Failed' } })),
      );

      (component as any).loadValidProducts('I1234567890', '2024-01-15T00:00:00Z');
      tick();

      expect(component.isLoadingProducts()).toBe(false);
    }));
  });

  // ── Computed Properties ───────────────────────────────────────────────────────

  describe('Computed Properties', () => {
    it('should compute selectedProductDescription', () => {
      component.productCodes.set(mockProducts);

      component.selectedProductCode.set('E0791');
      expect(component.selectedProductDescription()).toBe('Red Blood Cells Leukoreduced');

      component.selectedProductCode.set(null);
      expect(component.selectedProductDescription()).toBe('-');

      component.selectedProductCode.set('UNKNOWN');
      expect(component.selectedProductDescription()).toBe('-');
    });

    it('should compute hasMultipleDates', () => {
      expect(component.hasMultipleDates()).toBe(false);

      component.availableCollectionDates.set(['2024-01-15', '2024-01-20']);
      expect(component.hasMultipleDates()).toBe(true);

      component.availableCollectionDates.set(['2024-01-15']);
      expect(component.hasMultipleDates()).toBe(false);
    });

    it('should compute filteredInterdictions by search term', () => {
      component.interdictions.set(mockInterdictions);

      component.searchTerm.set('0010');
      expect(component.filteredInterdictions().length).toBe(1);
      expect(component.filteredInterdictions()[0].interCode).toBe('0010');

      component.searchTerm.set('');
      expect(component.filteredInterdictions().length).toBe(2);
    });

    it('should compute canRelease', () => {
      expect(component.canRelease()).toBe(false);

      component.selectedRows.set([mockInterdictions[0]]);
      expect(component.canRelease()).toBe(true);

      component.isReleasing.set(true);
      expect(component.canRelease()).toBe(false);
    });
  });

  // ── Selection ─────────────────────────────────────────────────────────────────

  describe('Selection', () => {


    it('should clear selectedRows', () => {
      component.selectedRows.set(mockInterdictions);
      component.onSelectionChange([]);
      expect(component.selectedRows()).toEqual([]);
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────────

  describe('Search', () => {
    it('should update search term via onSearch', () => {
      component.onSearch('0010');
      expect(component.searchTerm()).toBe('0010');
    });


  });

  // ── Release ───────────────────────────────────────────────────────────────────

  describe('Release', () => {
    beforeEach(() => {
      component.parsedUnitId.set('I1234567890');
      component.collectionDate.set('2024-01-15T00:00:00Z');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0791');
      component.interdictions.set(mockInterdictions);
    });





    it('should execute release with correct request', fakeAsync(() => {
      component.selectedRows.set(mockInterdictions);

      (component as any).executeRelease(mockInterdictions, 'E0791', '2024-01-15T00:00:00Z');
      tick();

      expect(serviceSpy.releaseInterdictions).toHaveBeenCalledWith({
        unitId: 'I1234567890',
        collDate: '2024-01-15T00:00:00Z',
        productCode: 'E0791',
        interCodes: ['0010', '0020'],
      });

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        '2 interdiction(s) released successfully',
      );
      expect(component.isReleasing()).toBe(false);
    }));

    it('should reload interdictions after release', fakeAsync(() => {
      const remaining = [mockInterdictions[0]];
      serviceSpy.getInterdictions.and.returnValue(of(remaining));

      (component as any).executeRelease([mockInterdictions[1]], 'E0791', '2024-01-15T00:00:00Z');
      tick();

      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'I1234567890', '2024-01-15T00:00:00Z', 'E0791', 'I',
      );
    }));

    it('should clear product when all interdictions released', fakeAsync(() => {
      serviceSpy.getInterdictions.and.returnValue(of([]));

      (component as any).executeRelease(mockInterdictions, 'E0791', '2024-01-15T00:00:00Z');
      tick();

      expect(component.selectedProductCode()).toBeNull();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        'All interdictions for this product have been released.',
      );
    }));

    it('should handle release API error', fakeAsync(() => {
      serviceSpy.releaseInterdictions.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to release' } })),
      );

      (component as any).executeRelease([mockInterdictions[0]], 'E0791', '2024-01-15T00:00:00Z');
      tick();

      expect(component.isReleasing()).toBe(false);
    }));
  });

  // ── State Management ──────────────────────────────────────────────────────────

  describe('State Management', () => {
    it('should reset state on unit cleared', () => {
      component.parsedUnitId.set('I1234567890');
      component.collectionDate.set('2024-01-15T00:00:00Z');
      component.productCodes.set(mockProducts);
      component.selectedProductCode.set('E0791');
      component.interdictions.set(mockInterdictions);
      component.showEntryForm.set(true);

      component.onUnitCleared();

      expect(component.parsedUnitId()).toBe('');
      expect(component.collectionDate()).toBe('');
      expect(component.productCodes()).toEqual([]);
      expect(component.selectedProductCode()).toBeNull();
      expect(component.interdictions()).toEqual([]);
      expect(component.showEntryForm()).toBe(false);
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

  // ── Date Formatting ───────────────────────────────────────────────────────────

  describe('Date Formatting', () => {
    it('should format ISO date', () => {
      expect(component.formatDate('2024-01-15T00:00:00Z')).toBe('15-JAN-2024');
    });








  });

  // ── Cleanup ───────────────────────────────────────────────────────────────────
});
