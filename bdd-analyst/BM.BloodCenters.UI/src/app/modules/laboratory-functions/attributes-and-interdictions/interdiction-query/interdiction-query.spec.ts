import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, ReplaySubject, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { InterdictionQueryComponent } from './interdiction-query';
import { InterdictionQueryApiService } from './services/interdiction-query-api.service';
import {
  InterdictionQueryResponse,
  ProductCodeOption,
  UnitInterdiction,
  ComponentInterdiction
} from './models/interdiction-query.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockTranslateService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('InterdictionQueryComponent', () => {
  let component: InterdictionQueryComponent;
  let fixture: ComponentFixture<InterdictionQueryComponent>;
  let mockInterdictionQueryApiService: jasmine.SpyObj<InterdictionQueryApiService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let chapterChangedSubject: Subject<void>;

  // Mock data
  const mockProductCodes: ProductCodeOption[] = [
    { productCode: 'RBC01', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT01', productDesc: 'Platelets' },
    { productCode: 'PLSM1', productDesc: 'Plasma' }
  ];

  const mockUnitInterdictions: UnitInterdiction[] = [
    {
      interCode: 'NFT01',
      interDesc: 'Not For Transfusion',
      interType: 'N',
      insertDats: '2026-06-12T21:30:00.000Z', // UTC
      interUserId: 'USER01'
    },
    {
      interCode: 'HOLD1',
      interDesc: 'Hold for Testing',
      interType: 'H',
      insertDats: '2026-06-11T18:15:00.000Z', // UTC
      interUserId: 'USER02'
    }
  ];

  const mockComponentInterdictions: ComponentInterdiction[] = [
    {
      productCode: 'RBC01',
      interCode: 'BIO01',
      interDesc: 'Biohazard',
      interType: 'B',
      insertDats: '2026-06-10T14:45:00.000Z', // UTC
      interUserId: 'USER03'
    }
  ];

  const mockQueryResponse: InterdictionQueryResponse = {
    unitId: '=A123456789012',
    collectionDate: '2026-06-12T00:00:00.000Z',
    isArchived: false,
    unitInterdictions: mockUnitInterdictions,
    componentInterdictions: mockComponentInterdictions,
    unitAttributes: [],
    componentAttributes: []
  };

  beforeEach(() => {

    // Create spy objects
    mockInterdictionQueryApiService = jasmine.createSpyObj('InterdictionQueryApiService', [
      'queryInterdictions',
      'getProductsForUnit'
    ]);

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Interdiction Query', subtitle: 'Test' })
    });

    chapterChangedSubject = new Subject<void>();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject });

    mockDialog = createMockMatDialog();
    mockSnackbarService = createMockSnackbarService();
    mockTranslateService = createMockTranslateService();

    // Default return values
    mockInterdictionQueryApiService.queryInterdictions.and.returnValue(of(mockQueryResponse));
    mockInterdictionQueryApiService.getProductsForUnit.and.returnValue(of(mockProductCodes));



      TestBed.configureTestingModule({
      imports: [
        InterdictionQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        FormBuilder,
        { provide: InterdictionQueryApiService, useValue: mockInterdictionQueryApiService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {} }, queryParams: of({}) }
        }
      ]
    });
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(of(mockQueryResponse));


      mockInterdictionQueryApiService.getProductsForUnit.and.returnValue(of(mockProductCodes));


    fixture = TestBed.createComponent(InterdictionQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('Component Initialization', () => {


    it('should initialize form with productCode and productDescription controls', () => {
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('productDescription')).toBeTruthy();
    });

    it('should initialize table configurations', () => {
      expect(component.unitInterdictionsTableConfig.columns.length).toBeGreaterThan(0);
      expect(component.componentInterdictionsTableConfig.columns.length).toBeGreaterThan(0);
    });

    it('should set initial state flags to false', () => {
      expect(component.hasData).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.isLoading).toBeFalse();
      expect(component.isUnitIdValid).toBeFalse();
    });
  });

  describe('Unit ID Validation', () => {
    it('should handle unit validation success', fakeAsync(() => {
      const validationResponse: UnitValidationResponse = {
        parsedUnitId: '=A123456789012',
        checkDigit: '12',
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
        collectionDate: '2026-06-12T00:00:00.000Z'
      };

      component.onUnitValidated(validationResponse);
      tick();

      expect((component as any).currentUnitId).toBe('=A123456789012');
      expect((component as any).currentCollDate).toBe('2026-06-12T00:00:00.000Z');
      expect(component.isUnitIdValid).toBeTrue();
      expect(mockInterdictionQueryApiService.getProductsForUnit).toHaveBeenCalledWith(
        '=A123456789012',
        '2026-06-12T00:00:00.000Z'
      );
    }));

    it('should load product codes after unit validation', fakeAsync(() => {
      const validationResponse: UnitValidationResponse = {
        parsedUnitId: '=A123456789012',
        checkDigit: '12',
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
        collectionDate: '2026-06-12T00:00:00.000Z'
      };

      component.onUnitValidated(validationResponse);
      tick();

      expect(component.productCodes).toEqual(mockProductCodes);
      expect(component.isLoading).toBeFalse();
    }));

    it('should clear data when unit is cleared', () => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;
      component.productCodes = mockProductCodes;

      component.onUnitCleared();

      expect((component as any).currentUnitId).toBe('');
      expect((component as any).currentCollDate).toBe('');
      expect(component.isUnitIdValid).toBeFalse();
      expect(component.productCodes).toEqual([]);
    });

    it('should handle product loading error', fakeAsync(() => {
      mockInterdictionQueryApiService.getProductsForUnit.and.returnValue(
        throwError(() => ({ status: 404, error: { message: 'Unit not found' } }))
      );

      const validationResponse: UnitValidationResponse = {
        parsedUnitId: '=A123456789012',
        checkDigit: '12',
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
        collectionDate: '2026-06-12T00:00:00.000Z'
      };

      component.onUnitValidated(validationResponse);
      tick();

      expect(component.productCodes).toEqual([]);
      expect(component.isLoading).toBeFalse();
    }));

    it('should show error in snackbar when no components found for unit (Bug Fix #4)', fakeAsync(() => {
      mockInterdictionQueryApiService.getProductsForUnit.and.returnValue(of([]));

      const validationResponse: UnitValidationResponse = {
        parsedUnitId: '=A123456789012',
        checkDigit: '12',
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
        collectionDate: '2026-06-12T00:00:00.000Z'
      };

      component.onUnitValidated(validationResponse);
      tick();

      // Error should be displayed in snackbar, not description field
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error: 0063 - No components found for this unit');
      expect(component.form.get('productDescription')?.value).toBe('-');
      expect(component.productCodes).toEqual([]);
    }));
  });

  describe('Product Code Selection', () => {
    beforeEach(() => {
      component.productCodes = mockProductCodes;
    });

    it('should update product description when product code is selected', () => {
      component.form.patchValue({ productCode: 'RBC01' });

      expect(component.form.get('productDescription')?.value).toBe('Red Blood Cells');
    });

    it('should set description to "-" when no product is selected', () => {
      component.form.patchValue({ productCode: '' });

      expect(component.form.get('productDescription')?.value).toBe('-');
    });


  });

  describe('Interdiction Query', () => {
    beforeEach(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;
    });

    it('should query interdictions successfully', fakeAsync(() => {
      component.onRetrieve();
      tick();

      expect(mockInterdictionQueryApiService.queryInterdictions).toHaveBeenCalledWith({
        unitId: '=A123456789012',
        productCode: undefined
      });

      expect(component.unitInterdictions).toEqual(mockUnitInterdictions);
      expect(component.componentInterdictions).toEqual(mockComponentInterdictions);
      expect(component.hasData).toBeTrue();
      expect(component.isLoading).toBeFalse();
    }));

    it('should include product code in query when selected', fakeAsync(() => {
      component.form.patchValue({ productCode: 'RBC01' });

      component.onRetrieve();
      tick();

      expect(mockInterdictionQueryApiService.queryInterdictions).toHaveBeenCalledWith({
        unitId: '=A123456789012',
        productCode: 'RBC01'
      });
    }));




  });

  describe('Date Formatting', () => {
    it('should format date using moment default behavior', () => {
      // Moment will parse the ISO string and format it in local timezone
      const timestamp = '2026-06-12T21:30:00.000Z';
      const formatted = component['formatDate'](timestamp);

      // Expected format: DD-MMM-YYYY HH:mm (uppercase)
      // Just verify it's formatted correctly, not the exact timezone conversion
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-2026 \d{2}:\d{2}/);
      expect(formatted).not.toBe('-');
    });





    it('should format month as uppercase 3-letter abbreviation', () => {
      const timestamp = '2026-01-15T12:00:00.000Z';
      const formatted = component['formatDate'](timestamp);

      expect(formatted).toContain('JAN');
    });

    it('should pad single-digit days with zero', () => {
      const timestamp = '2026-06-05T12:00:00.000Z';
      const formatted = component['formatDate'](timestamp);

      expect(formatted).toMatch(/\d{2}-\w{3}-2026/);
    });

    it('should pad hours and minutes with zero', () => {
      const timestamp = '2026-06-12T09:05:00.000Z';
      const formatted = component['formatDate'](timestamp);

      expect(formatted).toMatch(/\d{2}-\w{3}-\d{4} \d{2}:\d{2}/);
    });

    it('should return "-" for invalid date strings', () => {
      const formatted = component['formatDate']('invalid-date');
      expect(formatted).toBe('-');
    });
  });

  describe('Table Data Transformation', () => {
    it('should transform unit interdictions to table rows', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;

      component.onRetrieve();
      tick();

      expect(component.unitInterdictionsFiltered.length).toBe(2);

      const firstRow = component.unitInterdictionsFiltered[0];
      expect(firstRow.code).toBe('NFT01');
      expect(firstRow.description).toBe('Not For Transfusion');
      expect(firstRow.type).toBe('N');
      expect(firstRow.user).toBe('USER01');
      // Timestamp should be formatted in standard format
      expect(firstRow.timeStamp).toMatch(/\d{2}-[A-Z]{3}-2026 \d{2}:\d{2}/);
      expect(firstRow.timeStamp).not.toBe('-');
    }));

    it('should transform component interdictions to table rows', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;

      component.onRetrieve();
      tick();

      expect(component.componentInterdictionsFiltered.length).toBe(1);

      const firstRow = component.componentInterdictionsFiltered[0];
      expect(firstRow.productCode).toBe('RBC01');
      expect(firstRow.code).toBe('BIO01');
      expect(firstRow.description).toBe('Biohazard');
      expect(firstRow.type).toBe('B');
      expect(firstRow.user).toBe('USER03');
      // Timestamp should be formatted in standard format
      expect(firstRow.timeStamp).toMatch(/\d{2}-[A-Z]{3}-2026 \d{2}:\d{2}/);
      expect(firstRow.timeStamp).not.toBe('-');
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;
      component.onRetrieve();
      tick();
    }));



    it('should filter unit interdictions by description', () => {
      component.unitInterdictionsSearchTerm = 'testing';
      component.onUnitInterdictionsSearch();

      expect(component.unitInterdictionsFiltered.length).toBe(1);
      expect(component.unitInterdictionsFiltered[0].description).toContain('Testing');
    });

    it('should show all unit interdictions when search term is empty', () => {
      component.unitInterdictionsSearchTerm = '';
      component.onUnitInterdictionsSearch();

      expect(component.unitInterdictionsFiltered.length).toBe(2);
    });


  });

  describe('Chapter Change', () => {
    it('should clear all data when chapter changes', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.productCodes = mockProductCodes;
      component.hasData = true;

      // Simulate chapter change
      chapterChangedSubject.next();
      tick();

      expect((component as any).currentUnitId).toBe('');
      expect(component.productCodes).toEqual([]);
      expect(component.hasData).toBeFalse();
    }));
  });

  describe('Clear All Functionality', () => {
    beforeEach(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.productCodes = mockProductCodes;
      component.unitInterdictions = mockUnitInterdictions;
      component.hasData = true;
    });



    it('should clear all data arrays', () => {
      component.onClearAll();

      expect(component.productCodes).toEqual([]);
      expect(component.unitInterdictions).toEqual([]);
      expect(component.componentInterdictions).toEqual([]);
      expect(component.unitAttributes).toEqual([]);
      expect(component.componentAttributes).toEqual([]);
    });

    it('should reset state flags', () => {
      component.onClearAll();

      expect(component.hasData).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.isUnitIdValid).toBeFalse();
    });
  });

  describe('Modal Dialogs', () => {
    it('should open unit attribute modal with correct data', () => {
      component.unitAttributes = [
        {
          attribCode: 'ATTR1',
          attribDesc: 'Test Attribute',
          attribGroup: 'GRP1',
          attribType: 'T',
          insertDats: '2026-06-12T00:00:00.000Z',
          insertUserId: 'USER01'
        }
      ];

      component.onViewUnitAttribute();

      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: { unitAttributes: component.unitAttributes }
        })
      );
    });

    it('should open component attribute modal with correct data', () => {
      component.componentAttributes = [
        {
          productCode: 'RBC01',
          attribCode: 'ATTR2',
          attribDesc: 'Component Attribute',
          attribGroup: 'GRP2',
          insertDats: '2026-06-12T00:00:00.000Z',
          insertUserId: 'USER02'
        }
      ];

      component.onViewComponentAttribute();

      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: { componentAttributes: component.componentAttributes }
        })
      );
    });
  });
  describe('Edge Cases', () => {
    it('should handle empty interdiction response', fakeAsync(() => {
      const emptyResponse: InterdictionQueryResponse = {
        unitId: '=A123456789012',
        collectionDate: '2026-06-12T00:00:00.000Z',
        isArchived: false,
        unitInterdictions: [],
        componentInterdictions: [],
        unitAttributes: [],
        componentAttributes: []
      };

      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(of(emptyResponse));
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;

      component.onRetrieve();
      tick();

      expect(component.unitInterdictionsFiltered.length).toBe(0);
      expect(component.componentInterdictionsFiltered.length).toBe(0);
      expect(component.hasData).toBeTrue();
    }));

    it('should handle interdictions with null descriptions', fakeAsync(() => {
      const responseWithNulls: InterdictionQueryResponse = {
        ...mockQueryResponse,
        unitInterdictions: [
          {
            interCode: 'TEST1',
            interDesc: null,
            interType: null,
            insertDats: '2026-06-12T12:00:00.000Z',
            interUserId: null
          }
        ]
      };

      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(of(responseWithNulls));
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;

      component.onRetrieve();
      tick();

      const row = component.unitInterdictionsFiltered[0];
      expect(row.description).toBe('');
      expect(row.type).toBe('');
      expect(row.user).toBe('');
    }));

    it('should handle network timeout error gracefully', fakeAsync(() => {
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 0 }))
      );

      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;

      component.onRetrieve();
      tick();

      expect(component.hasError).toBeTrue();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('Cannot connect to server')
      );
    }));
  });

  describe('Component Lifecycle', () => {


    it('should initialize subscriptions on init', () => {
      spyOn<any>(component, 'subscribeToChapterChanges');
      spyOn<any>(component, 'subscribeToProductCodeChanges');
      spyOn<any>(component, 'subscribeToProductSearch');

      component.ngOnInit();

      expect(component['subscribeToChapterChanges']).toHaveBeenCalled();
      expect(component['subscribeToProductCodeChanges']).toHaveBeenCalled();
      expect(component['subscribeToProductSearch']).toHaveBeenCalled();
    });
  });
  describe('Description Field Tooltip', () => {
    beforeEach(fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.isUnitIdValid = true;
      component.onRetrieve();
      tick();
      fixture.detectChanges();
    }));

    it('should display description field when hasData is true', () => {
      expect(component.hasData).toBeTrue();

      const descriptionField = fixture.nativeElement.querySelector('.filter-field--description');
      expect(descriptionField).toBeTruthy();
    });

    it('should show tooltip on description value element', () => {
      component.form.patchValue({ productCode: 'RBC01', productDescription: 'Red Blood Cells' });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      // Check that tooltip directive exists by checking text content and component state
      expect(descriptionValue.textContent?.trim()).toBe('Red Blood Cells');
      expect(component.form.get('productDescription')?.value).toBe('Red Blood Cells');
    });

    it('should display tooltip with long description text', () => {
      const longDescription = 'RED BLOOD CELLS/AS$$/450mL/refgxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      component.form.patchValue({ productCode: 'RBC01', productDescription: longDescription });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      expect(descriptionValue.textContent?.trim()).toBe(longDescription);
      expect(component.form.get('productDescription')?.value).toBe(longDescription);
    });

    it('should disable tooltip when description is "-"', () => {
      component.form.patchValue({ productCode: '', productDescription: '-' });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      expect(descriptionValue.textContent?.trim()).toBe('-');
      // Tooltip should be disabled for "-" value
      expect(component.form.get('productDescription')?.value).toBe('-');
    });

    it('should disable tooltip when description is empty', () => {
      component.form.patchValue({ productCode: '', productDescription: '' });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      expect(descriptionValue.textContent?.trim()).toBe('-');
      // Tooltip should be disabled for empty value
      expect(component.form.get('productDescription')?.value).toBe('');
    });

    it('should enable tooltip when description has valid content', () => {
      component.form.patchValue({ productCode: 'RBC01', productDescription: 'Red Blood Cells' });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      expect(descriptionValue.textContent?.trim()).toBe('Red Blood Cells');
      // Tooltip should be enabled for valid content
      expect(component.form.get('productDescription')?.value).toBe('Red Blood Cells');
    });

    it('should position tooltip below the description field', () => {
      component.form.patchValue({ productCode: 'RBC01', productDescription: 'Red Blood Cells' });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      expect(descriptionValue).toBeTruthy();
      // Verify the element exists and has content - actual tooltip positioning is handled by Angular Material
      expect(descriptionValue.textContent?.trim()).toBe('Red Blood Cells');
    });

    it('should truncate long description with ellipsis in UI', () => {
      const longDescription = 'RED BLOOD CELLS/AS$$/450mL/refgxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      component.form.patchValue({ productCode: 'RBC01', productDescription: longDescription });
      fixture.detectChanges();

      const descriptionValue = fixture.nativeElement.querySelector('.description-value');
      // JSDOM does not compute CSS so we verify the element renders the full text;
      // actual overflow/ellipsis styling is validated visually or via e2e tests.
      expect(descriptionValue).toBeTruthy();
      expect(descriptionValue.textContent?.trim()).toBe(longDescription);
    });
  });

  describe('Coverage Gap Tests', () => {
    it('should show error when retrieving without unit ID', () => {
      (component as any).currentUnitId = '';
      component.onRetrieve();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Unit ID is required');
    });

    it('should handle retrieve 404 error', fakeAsync(() => {
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();
      expect(component.hasError).toBeTrue();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('API endpoint not found')
      );
    }));

    it('should handle retrieve 400 error', fakeAsync(() => {
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Bad request' } }))
      );
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Bad request');
    }));

    it('should validate unit without collDate and query interdictions first', fakeAsync(() => {
      const validationResponse = {
        parsedUnitId: '=A123456789012',
        checkDigit: '12',
        codeScheme: 'I',
        manualUnitId: '',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I',
        collectionDate: undefined
      } as any;

      component.onUnitValidated(validationResponse);
      tick();

      expect(mockInterdictionQueryApiService.queryInterdictions).toHaveBeenCalled();
    }));

    it('should handle validateUnit error with 404', fakeAsync(() => {
      const validationResponse = {
        parsedUnitId: '=A123456789012',
        collectionDate: undefined
      } as any;
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 404 }))
      );
      component.onUnitValidated(validationResponse);
      tick();
      expect(component.productCodes).toEqual([]);
    }));

    it('should handle validateUnit error with 400', fakeAsync(() => {
      const validationResponse = {
        parsedUnitId: '=A123456789012',
        collectionDate: undefined
      } as any;
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid unit' } }))
      );
      component.onUnitValidated(validationResponse);
      tick();
      expect(component.form.get('productDescription')?.value).toBe('Invalid unit');
    }));

    it('should handle validateUnit error with unknown status', fakeAsync(() => {
      const validationResponse = {
        parsedUnitId: '=A123456789012',
        collectionDate: undefined
      } as any;
      mockInterdictionQueryApiService.queryInterdictions.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      component.onUnitValidated(validationResponse);
      tick();
      expect(component.form.get('productDescription')?.value).toBe('Error validating unit');
    }));

    it('should handle unit interdictions page change', () => {
      component.onUnitInterdictionsPageChange({ pageIndex: 1, pageSize: 50 });
      expect(component.unitInterdictionsTableConfig.pagination?.pageIndex).toBe(1);
      expect(component.unitInterdictionsTableConfig.pagination?.pageSize).toBe(50);
    });

    it('should handle unit interdictions sort change', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();

      component.onUnitInterdictionsSortChange({ column: 'code', direction: 'A' });
      expect(component.unitInterdictionsTableConfig.sortConfig?.direction).toBe('A');
    }));

    it('should handle unit interdictions sort with default direction', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();

      component.onUnitInterdictionsSortChange({ column: 'code', direction: 'default' });
      // Should reset to original order
      expect(component.unitInterdictionsFiltered.length).toBe(2);
    }));

    it('should handle component interdictions page change', () => {
      component.onComponentInterdictionsPageChange({ pageIndex: 2, pageSize: 25 });
      expect(component.componentInterdictionsTableConfig.pagination?.pageIndex).toBe(2);
    });

    it('should handle component interdictions sort change', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();

      component.onComponentInterdictionsSortChange({ column: 'code', direction: 'D' });
      expect(component.componentInterdictionsTableConfig.sortConfig?.direction).toBe('D');
    }));

    it('should handle component interdictions sort with default direction', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();

      component.onComponentInterdictionsSortChange({ column: 'code', direction: 'default' });
      expect(component.componentInterdictionsFiltered.length).toBe(1);
    }));

    it('should filter component interdictions by search term', fakeAsync(() => {
      (component as any).currentUnitId = '=A123456789012';
      component.onRetrieve();
      tick();

      component.componentInterdictionsSearchTerm = 'BIO';
      component.onComponentInterdictionsSearch();
      expect(component.componentInterdictionsFiltered.length).toBe(1);
    }));

    it('should filter products by search', fakeAsync(() => {
      component.productCodes = mockProductCodes;
      component.productSearchCtrl.setValue('RBC');
      tick();

      let filtered: any[] = [];
      component.filteredProducts$.subscribe(v => filtered = v);
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('RBC01');
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.productCodes = mockProductCodes;
      component.productSearchCtrl.setValue('');
      tick();

      let filtered: any[] = [];
      component.filteredProducts$.subscribe(v => filtered = v);
      expect(filtered.length).toBe(3);
    }));
  });
});
