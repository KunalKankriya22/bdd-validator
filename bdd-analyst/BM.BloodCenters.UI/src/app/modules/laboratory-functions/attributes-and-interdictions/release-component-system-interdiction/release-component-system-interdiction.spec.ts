import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateService } from '@ngx-translate/core';

import { ReleaseComponentSystemInterdictionComponent } from './release-component-system-interdiction';
import { ReleaseComponentSystemInterdictionService } from './services/release-component-system-interdiction.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitResponseDto,
  ValidProductDto,
  ComponentSystemInterdictionDto,
  ApiResponse,
} from './models/release-component-system-interdiction.models';

describe('ReleaseComponentSystemInterdictionComponent', () => {
  let component: ReleaseComponentSystemInterdictionComponent;
  let fixture: ComponentFixture<ReleaseComponentSystemInterdictionComponent>;
  let serviceSpy: jasmine.SpyObj<ReleaseComponentSystemInterdictionService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockUnitValidation: ValidateUnitResponseDto = {
    unitId: 'W123417070471',
    collDate: '2025-01-11T00:00:00Z',
    availableCollectionDates: ['2025-01-11T00:00:00Z'],
    isValid: true,
  };

  const mockProducts: ValidProductDto[] = [
    { productCode: 'E0385V00', productDesc: 'RED BLOOD CELLS AS/4' },
    { productCode: 'E5165V00', productDesc: 'CRYPORECIPITATE|None/NS/<=-18C' },
  ];

  const mockInterdictions: ComponentSystemInterdictionDto[] = [
    {
      unitId: 'W123417070471',
      collDate: '2025-01-11T00:00:00Z',
      chapterId: 'DAL',
      productCode: 'E0385V00',
      interCode: 'CMTI',
      interDesc: 'Time.Max. Allowable',
      interType: 'N',
      interTypeDesc: 'NFT',
      insertDate: '2025-01-11T10:00:00Z',
      insertUser: 'SYSTEM',
    },
    {
      unitId: 'W123417070471',
      collDate: '2025-01-11T00:00:00Z',
      chapterId: 'DAL',
      productCode: 'E0385V00',
      interCode: 'CMW',
      interDesc: 'Weight Not In Allowable Range',
      interType: 'N',
      interTypeDesc: 'NFT',
      insertDate: '2025-01-11T11:00:00Z',
      insertUser: 'SYSTEM',
    },
  ];

  const mockReleaseResponse: ApiResponse<{ deletedCount: number }> = {
    success: true,
    message: 'Released',
    statusCode: 200,
    item: { deletedCount: 1 },
  };

  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ReleaseComponentSystemInterdictionService', [
      'validateUnit',
      'getValidProducts',
      'getInterdictions',
      'releaseInterdictions',
    ]);

    snackbarSpy = createMockSnackbarService();

    const headerServiceStub = {
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterId: jasmine.createSpy().and.returnValue('DAL'),
    };

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [
      'getTitle',
      'getSubtitle',
      'getCurrentMenuItem',
    ], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null),
    });

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
      imports: [ReleaseComponentSystemInterdictionComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        OverlayModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseComponentSystemInterdictionService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
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


    fixture = TestBed.createComponent(ReleaseComponentSystemInterdictionComponent);
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

  describe('Initialization', () => {






    it('should configure table with selection enabled', () => {
      expect(component.tableConfig.enableSelection).toBe(true);
      expect(component.tableConfig.selectionKey).toBe('interCode');
      expect(component.tableConfig.columns.length).toBe(3);
    });



    it('should have required validator on productCodeControl', () => {
      expect(component.productCodeControl.hasError('required')).toBe(true);
    });
  });

  describe('Unit Validation', () => {
    it('should validate unit and auto-load products for single collection date', fakeAsync(() => {
      component.onUnitValidated({ parsedUnitId: 'W123417070471', codeScheme: 'I' } as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('W123417070471');
      expect(component.parsedUnitId()).toBe('W123417070471');
      expect(component.codeScheme()).toBe('I');
      expect(component.showEntryForm()).toBe(true);
      expect(component.collectionDate()).toBe('2025-01-11T00:00:00Z');
      expect(serviceSpy.getValidProducts).toHaveBeenCalledWith('W123417070471', '2025-01-11T00:00:00Z', 'I');
      expect(component.productCodes()).toEqual(mockProducts);
      expect(component.filteredProductCodes()).toEqual(mockProducts);
    }));

    it('should show collection date dropdown for multiple dates', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of({
        ...mockUnitValidation,
        availableCollectionDates: ['2025-01-11T00:00:00Z', '2025-01-20T00:00:00Z'],
      }));

      component.onUnitValidated({ parsedUnitId: 'W123417070471', codeScheme: 'I' } as any);
      tick();

      expect(component.availableCollectionDates().length).toBe(2);
      expect(component.hasMultipleDates()).toBe(true);
      expect(serviceSpy.getValidProducts).not.toHaveBeenCalled();
    }));



    it('should handle validation API error', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } })),
      );

      component.onUnitValidated({ parsedUnitId: 'INVALID', codeScheme: 'C' } as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('INVALID');
    }));
  });

  describe('Collection Date Selection', () => {
    it('should load products when date is selected', fakeAsync(() => {
      component.parsedUnitId.set('W123417070471');
      component.codeScheme.set('I');

      component.onCollDateSelected('2025-01-20T00:00:00Z');
      tick();

      expect(component.collectionDate()).toBe('2025-01-20T00:00:00Z');
      expect(serviceSpy.getValidProducts).toHaveBeenCalledWith('W123417070471', '2025-01-20T00:00:00Z', 'I');
    }));

    it('should reset product and interdiction state on date change', fakeAsync(() => {
      component.parsedUnitId.set('W123417070471');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0385V00');
      component.interdictions.set(mockInterdictions);
      component.selectedRows.set([mockInterdictions[0]]);

      component.onCollDateSelected('2025-01-20T00:00:00Z');
      tick();

      expect(component.selectedProductCode()).toBeNull();
      expect(component.interdictions()).toEqual([]);
      expect(component.selectedRows()).toEqual([]);
    }));
  });

  describe('Product Selection', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W123417070471');
      component.collectionDate.set('2025-01-11T00:00:00Z');
      component.codeScheme.set('I');
      component.productCodes.set(mockProducts);
      component.filteredProductCodes.set(mockProducts);
    });

    it('should load interdictions when product is selected', fakeAsync(() => {
      component.productCodeControl.setValue('E0385V00');
      tick();

      expect(component.selectedProductCode()).toBe('E0385V00');
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'W123417070471', '2025-01-11T00:00:00Z', 'E0385V00', 'I', undefined,
      );
      expect(component.interdictions()).toEqual(mockInterdictions);
      expect(component.hasLoadedInterdictions()).toBe(true);
    }));





    it('should handle product load error', fakeAsync(() => {
      serviceSpy.getValidProducts.and.returnValue(
        throwError(() => ({ error: { message: 'Failed' } })),
      );

      (component as any).loadValidProducts('W123417070471', '2025-01-11T00:00:00Z');
      tick();

      expect(component.isLoadingProducts()).toBe(false);
    }));
  });



  describe('Server-Side Search', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W123417070471');
      component.collectionDate.set('2025-01-11T00:00:00Z');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0385V00');
      component.interdictions.set(mockInterdictions);
      component.hasLoadedInterdictions.set(true);
    });

    it('should call loadInterdictions with search term on onSearch', fakeAsync(() => {
      component.onSearch('CMTI');
      tick();

      expect(component.searchTerm()).toBe('CMTI');
      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'W123417070471', '2025-01-11T00:00:00Z', 'E0385V00', 'I', 'CMTI',
      );
    }));

    it('should pass undefined interCode when search term is empty', fakeAsync(() => {
      component.onSearch('');
      tick();

      expect(serviceSpy.getInterdictions).toHaveBeenCalledWith(
        'W123417070471', '2025-01-11T00:00:00Z', 'E0385V00', 'I', undefined,
      );
    }));

    it('should not reset product when search returns 0 results', fakeAsync(() => {
      serviceSpy.getInterdictions.and.returnValue(of([]));
      component.searchTerm.set('NONEXISTENT');

      component.onSearch('NONEXISTENT');
      tick();

      expect(component.selectedProductCode()).toBe('E0385V00');
      expect(snackbarSpy.showInfo).not.toHaveBeenCalled();
    }));


  });

  describe('Computed Properties', () => {
    it('should compute selectedProductDescription', () => {
      component.productCodes.set(mockProducts);

      component.selectedProductCode.set('E0385V00');
      expect(component.selectedProductDescription()).toBe('RED BLOOD CELLS AS/4');

      component.selectedProductCode.set(null);
      expect(component.selectedProductDescription()).toBe('-');

      component.selectedProductCode.set('UNKNOWN');
      expect(component.selectedProductDescription()).toBe('-');
    });

    it('should compute hasMultipleDates', () => {
      expect(component.hasMultipleDates()).toBe(false);

      component.availableCollectionDates.set(['2025-01-11', '2025-01-20']);
      expect(component.hasMultipleDates()).toBe(true);

      component.availableCollectionDates.set(['2025-01-11']);
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
  describe('Release', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W123417070471');
      component.collectionDate.set('2025-01-11T00:00:00Z');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0385V00');
      component.interdictions.set(mockInterdictions);
    });





    it('should execute release with correct request', fakeAsync(() => {
      component.selectedRows.set([mockInterdictions[0]]);

      (component as any).executeRelease([mockInterdictions[0]], 'E0385V00', '2025-01-11T00:00:00Z');
      tick();

      expect(serviceSpy.releaseInterdictions).toHaveBeenCalledWith({
        unitId: 'W123417070471',
        collDate: '2025-01-11T00:00:00Z',
        productCode: 'E0385V00',
        interCodes: ['CMTI'],
      });

      expect(snackbarSpy.showInfo).toHaveBeenCalledWith(
        '1 component has been released',
      );
      expect(component.isReleasing()).toBe(false);
    }));

    it('should reset form after successful release', fakeAsync(() => {
      (component as any).executeRelease([mockInterdictions[0]], 'E0385V00', '2025-01-11T00:00:00Z');
      tick();

      expect(component.parsedUnitId()).toBe('');
      expect(component.interdictions()).toEqual([]);
      expect(component.hasLoadedInterdictions()).toBe(false);
      expect(component.showEntryForm()).toBe(false);
    }));

    it('should handle release API error', fakeAsync(() => {
      serviceSpy.releaseInterdictions.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to release' } })),
      );

      (component as any).executeRelease([mockInterdictions[0]], 'E0385V00', '2025-01-11T00:00:00Z');
      tick();

      expect(component.isReleasing()).toBe(false);
    }));

  });

  describe('Interdiction Load - Zero Results Without Search', () => {
    beforeEach(() => {
      component.parsedUnitId.set('W123417070471');
      component.collectionDate.set('2025-01-11T00:00:00Z');
      component.codeScheme.set('I');
      component.selectedProductCode.set('E0385V00');
    });



    it('should NOT reset product when search filter returns 0 results', fakeAsync(() => {
      serviceSpy.getInterdictions.and.returnValue(of([]));
      component.searchTerm.set('NONEXISTENT');

      (component as any).loadInterdictions('E0385V00');
      tick();

      expect(component.selectedProductCode()).toBe('E0385V00');
      expect(snackbarSpy.showInfo).not.toHaveBeenCalled();
    }));
  });

  describe('State Management', () => {
    it('should reset state on unit cleared', () => {
      component.parsedUnitId.set('W123417070471');
      component.collectionDate.set('2025-01-11T00:00:00Z');
      component.productCodes.set(mockProducts);
      component.filteredProductCodes.set(mockProducts);
      component.selectedProductCode.set('E0385V00');
      component.interdictions.set(mockInterdictions);
      component.hasLoadedInterdictions.set(true);
      component.showEntryForm.set(true);

      component.onUnitCleared();

      expect(component.parsedUnitId()).toBe('');
      expect(component.collectionDate()).toBe('');
      expect(component.productCodes()).toEqual([]);
      expect(component.filteredProductCodes()).toEqual([]);
      expect(component.selectedProductCode()).toBeNull();
      expect(component.interdictions()).toEqual([]);
      expect(component.hasLoadedInterdictions()).toBe(false);
      expect(component.showEntryForm()).toBe(false);
      expect(component.searchTerm()).toBe('');
    });



    it('should reset all on clearAll', () => {
      component.parsedUnitId.set('W123417070471');
      component.showEntryForm.set(true);
      component.interdictions.set(mockInterdictions);
      component.hasLoadedInterdictions.set(true);

      component.clearAll();

      expect(component.parsedUnitId()).toBe('');
      expect(component.showEntryForm()).toBe(false);
      expect(component.interdictions()).toEqual([]);
      expect(component.hasLoadedInterdictions()).toBe(false);
    });


  });

  describe('Date Formatting', () => {
    it('should format ISO date', () => {
      expect(component.formatDate('2025-01-11T00:00:00Z')).toBe('11-JAN-2025');
    });








  });
});
