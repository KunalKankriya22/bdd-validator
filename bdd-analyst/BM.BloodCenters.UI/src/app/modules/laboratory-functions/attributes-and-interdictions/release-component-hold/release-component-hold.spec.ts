import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ReleaseComponentHoldComponent } from './release-component-hold';
import { ComponentHoldApiService } from './services/component-hold-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { SearchBar } from '@shared/components/search-bar/search-bar';
import { DataTable } from '@shared/components/data-table/data-table';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { DataTableStub, UnitIdFieldStub, SearchBarStub } from '@shared/testing/component-stubs';

describe('ReleaseComponentHoldComponent', () => {
  let loggingServiceSpy: any;
  let apiServiceSpy: any;
  let component: ReleaseComponentHoldComponent;
  let fixture: ComponentFixture<ReleaseComponentHoldComponent>;
  let apiService: jasmine.SpyObj<ComponentHoldApiService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let dialog: MatDialog;

  const mockUnitData = {
    unitId: 'W1234170704 1-F',
    collectionDate: '2025-01-11T00:00:00.000Z',
    chapterId: 'BCH',
    availableProducts: [
      { productCode: 'E0385V00', productDescription: 'RED BLOOD CELLS AS/4' },
      { productCode: 'E0422V00', productDescription: 'PLATELETS APHERESIS' }
    ]
  };

  const mockHoldsResponse = {
    unitId: 'W1234170704 1-F',
    collectionDate: '2025-01-11T00:00:00.000Z',
    chapterId: 'BCH',
    productCode: 'E0385V00',
    productDescription: 'RED BLOOD CELLS AS/4',
    holds: [
      { interdictionCode: 'CPRJ', interdictionDescription: 'Component Prod. Review Hold' },
      { interdictionCode: 'NFT', interdictionDescription: 'Not For Transfusion' }
    ]
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ComponentHoldApiService', [
      'validateUnit',
      'getProductsWithHolds',
      'retrieveComponentHolds',
      'releaseHolds'
    ]);
    const snackbarServiceSpy = createMockSnackbarService();
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', [
      'debug',
      'info',
      'error'
    ]);
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({
        title: 'Release Component Hold',
        subtitle: 'Allows authorised users to remove a component hold once conditions are met.',
        menuItemId: 'release-component-hold'
      })
    });



      TestBed.configureTestingModule({
      imports: [
        ReleaseComponentHoldComponent,
        ReactiveFormsModule,
        FormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatTableModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        UnitIdFieldComponent,
        SearchBar,
        DataTable
      ],
      providers: [
        { provide: ComponentHoldApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        Overlay,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    })
    .overrideComponent(ReleaseComponentHoldComponent, {
      remove: { imports: [DataTable, UnitIdFieldComponent, SearchBar] },
      add: { imports: [DataTableStub, UnitIdFieldStub, SearchBarStub] },
    });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getProductsWithHolds.calls.reset();


      apiServiceSpy.retrieveComponentHolds.calls.reset();


      apiServiceSpy.releaseHolds.calls.reset();


      loggingServiceSpy.debug.calls.reset();


      loggingServiceSpy.info.calls.reset();


      loggingServiceSpy.error.calls.reset();


    apiService = TestBed.inject(ComponentHoldApiService) as jasmine.SpyObj<ComponentHoldApiService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    pageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;

    fixture = TestBed.createComponent(ReleaseComponentHoldComponent);
    component = fixture.componentInstance;
    dialog = (component as any).dialog;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {


    it('should set page header configuration from PageHeaderService', () => {
      expect(component.headerConfig.title).toBe('Release Component Hold');
      expect(component.headerConfig.subtitle).toContain('authorised users');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Release Component Hold');
    });


  });

  describe('Unit Validation', () => {
    it('should validate unit successfully', () => {
      apiService.validateUnit.and.returnValue(of(mockUnitData));
      apiService.getProductsWithHolds.and.returnValue(of(mockUnitData.availableProducts));

      component.onUnitValidated({
        parsedUnitId: 'W1234170704 1-F',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W1234170704 1-F',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });

      expect(apiService.validateUnit).toHaveBeenCalledWith('W1234170704 1-F');
      expect(component.formState().isUnitValidated).toBe(true);
      expect(component.formState().unitId).toBe('W1234170704 1-F');
    });

    it('should handle unit validation error', () => {
      apiService.validateUnit.and.returnValue(throwError(() => ({ message: 'Unit not found' })));

      component.onUnitValidated({
        parsedUnitId: 'INVALID',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'INVALID',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });

      expect(snackbarService.showError).toHaveBeenCalledWith('Unit not found');
      expect(component.formState().isUnitValidated).toBe(false);
    });

    it('should clear form when unit is cleared', () => {
      // First set some data
      component.formState.set({
        unitId: 'W1234170704 1-F',
        collectionDate: '2025-01-11',
        chapterId: 'BCH',
        productCode: 'E0385V00',
        productDescription: 'RED BLOOD CELLS',
        isUnitValidated: true,
        isProductValidated: true
      });

      component.onUnitCleared();

      expect(component.formState().unitId).toBe('');
      expect(component.formState().isUnitValidated).toBe(false);
      expect(component.componentHolds().length).toBe(0);
    });
  });

  describe('Product Selection', () => {
    beforeEach(() => {
      component.availableProducts.set(mockUnitData.availableProducts);
    });

    it('should update form state when product is selected', () => {
      component.onProductChange('E0385V00');

      expect(component.formState().productCode).toBe('E0385V00');
      expect(component.formState().productDescription).toBe('RED BLOOD CELLS AS/4');
      expect(component.formState().isProductValidated).toBe(true);
    });


  });

  describe('Retrieve Holds', () => {
    beforeEach(() => {
      component.formState.set({
        unitId: 'W1234170704 1-F',
        collectionDate: '2025-01-11T00:00:00.000Z',
        chapterId: 'BCH',
        productCode: 'E0385V00',
        productDescription: 'RED BLOOD CELLS AS/4',
        isUnitValidated: true,
        isProductValidated: true
      });
    });

    it('should retrieve holds successfully', () => {
      apiService.retrieveComponentHolds.and.returnValue(of(mockHoldsResponse));

      component.onRetrieve();

      expect(apiService.retrieveComponentHolds).toHaveBeenCalled();
      expect(component.componentHolds().length).toBe(2);
      expect(component.componentHolds()[0].interdictionCode).toBe('CPRJ');
    });






  });

  describe('Hold Selection', () => {
    beforeEach(() => {
      component.componentHolds.set([
        {
          unitId: 'W1234170704 1-F',
          collectionDate: '2025-01-11',
          chapterId: 'BCH',
          productCode: 'E0385V00',
          interdictionCode: 'CPRJ',
          interdictionDescription: 'Component Prod. Review Hold',
          selected: false
        },
        {
          unitId: 'W1234170704 1-F',
          collectionDate: '2025-01-11',
          chapterId: 'BCH',
          productCode: 'E0385V00',
          interdictionCode: 'NFT',
          interdictionDescription: 'Not For Transfusion',
          selected: false
        }
      ]);
    });

    it('should handle selection change from data table', () => {
      const selectedRows = [component.componentHolds()[0]];
      component.onSelectionChange(selectedRows);

      expect(component.selectedHolds().length).toBe(1);
      expect(component.hasSelectedHolds()).toBe(true);
      expect(component.selectedCount()).toBe(1);
    });



    it('should clear all selections and reset form', () => {
      component.formState.set({
        unitId: 'W1234170704 1-F',
        collectionDate: '2025-01-11',
        chapterId: 'BCH',
        productCode: 'E0385V00',
        productDescription: 'RED BLOOD CELLS',
        isUnitValidated: true,
        isProductValidated: true
      });
      component.selectedHolds.set([component.componentHolds()[0]]);

      component.onClearAll();

      expect(component.formState().unitId).toBe('');
      expect(component.selectedHolds().length).toBe(0);
      expect(component.componentHolds().length).toBe(0);
    });
  });

  describe('Release Holds', () => {
    beforeEach(() => {
      // Reset spy call counts
      snackbarService.showError.calls.reset();
      snackbarService.showSuccess.calls.reset();
      apiService.releaseHolds.calls.reset();

      component.formState.set({
        unitId: 'W1234170704 1-F',
        collectionDate: '2025-01-11T00:00:00.000Z',
        chapterId: 'BCH',
        productCode: 'E0385V00',
        productDescription: 'RED BLOOD CELLS AS/4',
        isUnitValidated: true,
        isProductValidated: true
      });

      component.componentHolds.set([
        {
          unitId: 'W1234170704 1-F',
          collectionDate: '2025-01-11',
          chapterId: 'BCH',
          productCode: 'E0385V00',
          interdictionCode: 'CPRJ',
          interdictionDescription: 'Component Prod. Review Hold',
          selected: true
        }
      ]);
      component.selectedHolds.set([component.componentHolds()[0]]);
    });

    it('should show confirmation dialog on release', () => {
      // Verify state before calling onRelease
      expect(component.selectedHolds().length).toBe(1);
      expect(component.hasSelectedHolds()).toBe(true);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(false) });
      const dialogOpenSpy = spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      component.onRelease();

      // Should not show error
      expect(snackbarService.showError).not.toHaveBeenCalled();
      // Should open dialog
      expect(dialogOpenSpy).toHaveBeenCalled();
    });

    it('should release holds after confirmation', fakeAsync(() => {
      apiService.releaseHolds.and.returnValue(
        of({ success: true, message: 'Released', releasedCount: 1 })
      );

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(true) });
      spyOn(dialog, 'open').and.returnValue(dialogRefSpy);

      component.onRelease();
      flushMicrotasks();

      expect(apiService.releaseHolds).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalled();
    }));




  });

  describe('Date Formatting', () => {
    it('should format collection date as DD-MON-YYYY uppercase', () => {
      component.formState.update(state => ({
        ...state,
        collectionDate: '2025-01-11T00:00:00.000Z'
      }));

      const formatted = component.formatCollectionDate();

      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(formatted).toBe('11-JAN-2025');
    });


  });

  describe('Search', () => {
    beforeEach(() => {
      component.componentHolds.set([
        {
          unitId: 'W1234170704 1-F',
          collectionDate: '2025-01-11',
          chapterId: 'BCH',
          productCode: 'E0385V00',
          interdictionCode: 'CPRJ',
          interdictionDescription: 'Component Prod. Review Hold',
          selected: false
        },
        {
          unitId: 'W1234170704 1-F',
          collectionDate: '2025-01-11',
          chapterId: 'BCH',
          productCode: 'E0385V00',
          interdictionCode: 'NFT',
          interdictionDescription: 'Not For Transfusion',
          selected: false
        }
      ]);
      component.dataSource.data = component.componentHolds();
    });

    it('should filter holds by interdiction code on search', () => {
      component.onSearch('CPRJ');

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].interdictionCode).toBe('CPRJ');
    });

    it('should filter holds by description on search', () => {
      component.onSearch('Transfusion');

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].interdictionCode).toBe('NFT');
    });

    it('should show all holds when search term is empty', () => {
      component.onSearch('CPRJ');
      expect(component.dataSource.data.length).toBe(1);

      component.onSearch('');
      expect(component.dataSource.data.length).toBe(2);
    });

    it('should return no results when search term does not match', () => {
      component.onSearch('NONEXISTENT');

      expect(component.dataSource.data.length).toBe(0);
    });
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      const destroySubject = (component as any).destroy$;
      const nextSpy = spyOn(destroySubject, 'next');
      const completeSpy = spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const mainContent = compiled.querySelector('main[aria-label]');
      expect(mainContent).toBeTruthy();
      expect(mainContent?.getAttribute('aria-label')).toContain('Release Component Hold');
    });

    it('should have status regions with aria-live', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const statusRegions = compiled.querySelectorAll('[aria-live="polite"]');
      expect(statusRegions.length).toBeGreaterThan(0);
    });
  });
});
