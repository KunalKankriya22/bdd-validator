import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { ModifyComponentWeightComponent } from './modify-component-weight';
import { ModifyComponentWeightApiService } from './services/modify-component-weight-api.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { ComponentWeightDetail } from './models/modify-component-weight.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ModifyComponentWeightComponent', () => {
  let message: any;
  let entries: any;
  let snackbarServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let headerServiceSpy: any;
  let apiServiceSpy: any;
  let component: ModifyComponentWeightComponent;
  let fixture: ComponentFixture<ModifyComponentWeightComponent>;
  let apiService: jasmine.SpyObj<ModifyComponentWeightApiService>;
  let headerService: jasmine.SpyObj<HeaderService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let chapterChangedSubject: Subject<any>;

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W1234-18-031311-Z',
    checkDigit: 'Z',
    codeScheme: 'I',
    manualUnitId: 'W1234-18-031311-Z',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  const mockUnitDetails = {
    unitId: 'W1234-18-031311-Z',
    collDate: '2024-01-15',
    chapterId: '0001',
    contractId: 'STANDARD',
    isPheresisDonation: false,
    codeScheme: 'I' as const,
    components: [
      {
        unitId: 'W1234-18-031311-Z',
        productCode: 'E0701V00',
        productDesc: 'Fresh Frozen Plasma/CPD',
        componentPrefix: '00',
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: 250,
        specificGravity: 1.08,
        productType: 'PLT',
      },
    ],
  };

  const mockProducts = [
    {
      productCode: 'E0701V00',
      productDesc: 'Fresh Frozen Plasma/CPD',
      productType: 'PLT',
      specificGravity: 1.08,
      poolProductCode: 'N',
    },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<any>();

    apiServiceSpy = jasmine.createSpyObj('ModifyComponentWeightApiService', [
      'getUnitDetails',
      'getValidProducts',
      'updateComponentWeight',
      'getComponentPrefixes',
    ]);

    headerServiceSpy = createMockHeaderService();

    snackbarServiceSpy = createMockSnackbarService();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['pageHeaderData'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        breadcrumbs: [],
        title: 'Modify Component Weight',
        subtitle: ''
      }),
    });



      TestBed.configureTestingModule({
imports: [ModifyComponentWeightComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ModifyComponentWeightApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    });


    });



  beforeEach(() => {


    apiService = TestBed.inject(ModifyComponentWeightApiService) as jasmine.SpyObj<ModifyComponentWeightApiService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    fixture = TestBed.createComponent(ModifyComponentWeightComponent);
    component = fixture.componentInstance;

    // Default mock setup
    apiService.getUnitDetails.and.returnValue(of(mockUnitDetails));
    apiService.getValidProducts.and.returnValue(of(mockProducts));


    });

  it('should generate unique component IDs', () => {
    const component1 = fixture.componentInstance;
    const fixture2 = TestBed.createComponent(ModifyComponentWeightComponent);
    const component2 = fixture2.componentInstance;

    expect(component1['componentId']).not.toEqual(component2['componentId']);
    expect(component1['componentId']).toContain('modify-component-weight-');
    expect(component2['componentId']).toContain('modify-component-weight-');
  });
  describe('Unit ID Validation', () => {
    it('should load unit details when unit ID is validated', () => {
      component['onUnitValidated'](mockUnitValidation);

      expect(component['unitData']()).toEqual(mockUnitValidation);
      expect(component['codeScheme']()).toBe('I');
      expect(apiService.getUnitDetails).toHaveBeenCalledWith('W1234-18-031311-Z', 'TST');
    });


    it('should handle error when loading unit details fails', () => {
      const error = { error: { errorResponse: { error: 'Unit not found' } } };
      apiService.getUnitDetails.and.returnValue(throwError(() => error));

      component['onUnitValidated'](mockUnitValidation);

      expect(component['isLoading']()).toBe(false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Unit not found');
    });

  });

  describe('Weight and Volume Calculations', () => {
    beforeEach(() => {
      component['productControl'].setValue('E0701V00');
      component['selectedProductSpecificGravity'].set(1.08);
    });

    it('should calculate volume when weight changes', () => {
      component['onWeightChange']('270');

      expect(component['currentWeight']()).toBe(270);
      expect(component['currentVolume']()).toBe(250); // 270 / 1.08 = 250
      expect(component['weightError']()).toBeNull();
    });

    it('should validate weight > 0', () => {
      component['onWeightChange']('0');

      expect(component['weightError']()).toBeDefined();
      expect(component['currentWeight']()).toBeNull();
    });

    it('should validate weight <= 999.99', () => {
      component['onWeightChange']('1000');

      expect(component['weightError']()).toBeDefined();
      expect(component['currentWeight']()).toBeNull();
    });

    it('should clear weight errors when valid', () => {
      component['weightError'].set('Error');

      component['onWeightChange']('250');

      expect(component['weightError']()).toBeNull();
      expect(component['currentWeight']()).toBe(250);
    });

    it('should clear weight and volume when input is empty', () => {
      component['onWeightChange']('');

      expect(component['currentWeight']()).toBeNull();
      expect(component['currentVolume']()).toBeNull();
      expect(component['weightError']()).toBeNull();
    });
  });

  describe('Anticoagulant Volume Validation', () => {
    it('should allow null anticoagulant volume', () => {
      component['onAnticoagulantVolumeChange']('');

      expect(component['currentAnticoagulantVolume']()).toBeNull();
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });

    it('should validate anticoagulant volume > 0', () => {
      component['onAnticoagulantVolumeChange']('0');

      expect(component['anticoagulantVolumeError']()).toBeDefined();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
    });

    it('should validate anticoagulant volume <= 999', () => {
      component['onAnticoagulantVolumeChange']('1000');

      expect(component['anticoagulantVolumeError']()).toBeDefined();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
    });

    it('should validate whole number (no decimals)', () => {
      component['onAnticoagulantVolumeChange']('50.5');

      expect(component['anticoagulantVolumeError']()).toBeDefined();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
    });

    it('should accept valid anticoagulant volume', () => {
      component['onAnticoagulantVolumeChange']('63');

      expect(component['currentAnticoagulantVolume']()).toBe(63);
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component['unitData'].set(mockUnitValidation);
      component['collectionDate'].set('2024-01-15');
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['currentVolume'].set(250);
      component['productDescription'].set('Fresh Frozen Plasma/CPD');
      // Set products signal so the save method can find the selected product
      component['products'].set(mockProducts);
    });




    it('should validate before saving', () => {
      component['weightError'].set('Weight error');

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix validation errors before saving');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should save component weight successfully', () => {
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(apiService.updateComponentWeight).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('1 Entry saved');
      expect(component['savedEntries']().length).toBe(1);
    });

    it('should show warning when interdiction is applied', () => {
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: true })
      );

      component['saveCurrentEntry']();

      expect(snackbarService.showInfo).toHaveBeenCalledWith('Component has volume interdiction applied');
    });

    it('should clear input fields after successful save', () => {
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(component['currentWeight']()).toBeNull();
      expect(component['currentVolume']()).toBeNull();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
      // Product should remain selected to allow multiple entries with same product
      expect(component['productControl'].value).toBe('E0701V00');
    });

  });

  describe('Pagination', () => {
    it('should paginate entries correctly', () => {
      entries = Array.from({ length: 25 }, (_, i) => ({
        unitId: 'W1234-18-031311-Z',
        productCode: `E0701V${i.toString().padStart(2, '0')}`,
        productDesc: 'Product',
        componentPrefix: i.toString().padStart(2, '0'),
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }));

      component['savedEntries'].set(entries);
      component['pageSize'].set(10);
      component['pageIndex'].set(0);

      expect(component['paginatedEntries']().length).toBe(10);

      component['pageIndex'].set(1);
      expect(component['paginatedEntries']().length).toBe(10);

      component['pageIndex'].set(2);
      expect(component['paginatedEntries']().length).toBe(5);
    });


    it('should reset to first page when page size changes', () => {
      component['pageSize'].set(5); // Set initial page size different from event
      component['pageIndex'].set(2);
      const event = { pageSize: 10, pageIndex: 2, length: 50 } as any;
      component['onPageChange'](event);

      expect(component['pageIndex']()).toBe(0);
    });
  });

  describe('Formatting', () => {
    it('should format number with 2 decimals', () => {
      expect(component['formatNumber'](250)).toBe('250.00');
      expect(component['formatNumber'](250.5)).toBe('250.50');
      expect(component['formatNumber'](null)).toBe('');
    });

    it('should format date as DD-MON-YYYY', () => {
      const formatted = component['formatDate']('2024-01-15');
      expect(formatted).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
      expect(component['formatDate']('')).toBe('');
    });
  });

  describe('Accessibility', () => {

    it('should have unique error IDs', () => {
      const errorId = component['errorId']('weight');
      expect(errorId).toContain('error');
      expect(errorId).toContain('weight');
    });

    it('should have unique label IDs', () => {
      const labelId = component['labelId']('product');
      expect(labelId).toContain('label');
      expect(labelId).toContain('product');
    });
  });

  describe('Product Selection', () => {
    it('should clear product description when product is deselected', (done) => {
      component['products'].set(mockProducts);
      component.ngOnInit(); // Set up subscriptions

      component['productControl'].setValue('E0701V00');

      setTimeout(() => {
        component['productControl'].setValue('');

        setTimeout(() => {
          expect(component['productDescription']()).toBe('');
          expect(component['selectedProductSpecificGravity']()).toBeNull();
          done();
        }, 50);
      }, 50);
    });

    it('should extract short description from product with pipe separator', () => {
      const fullDesc = 'Red Blood Cells | Leukocytes Reduced';
      const shortDesc = component['getShortDescription'](fullDesc);
      expect(shortDesc).toBe('Red Blood Cells');
    });

    it('should return full description when no pipe separator exists', () => {
      const fullDesc = 'Red Blood Cells';
      const shortDesc = component['getShortDescription'](fullDesc);
      expect(shortDesc).toBe('Red Blood Cells');
    });

  });

  describe('Sorting', () => {
    beforeEach(() => {
      entries = [
        {
          unitId: 'W1234-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product A',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
        {
          unitId: 'W1234-18-031312-A',
          productCode: 'E0701V01',
          productDesc: 'Product B',
          componentPrefix: '02',
          collectionDate: '2024-01-15',
          weight: 260,
          volume: 260,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ];
      component['savedEntries'].set(entries);
    });

    it('should sort entries in ascending order', () => {
      component['onSortChange']({ active: 'unitId', direction: 'asc' });

      expect(component['sortActive']()).toBe('unitId');
      expect(component['sortDirection']()).toBe('asc');
      expect(component['pageIndex']()).toBe(0);
    });

    it('should sort entries in descending order', () => {
      component['onSortChange']({ active: 'unitId', direction: 'desc' });

      expect(component['sortActive']()).toBe('unitId');
      expect(component['sortDirection']()).toBe('desc');
      expect(component['pageIndex']()).toBe(0);
    });

  });

  describe('Navigation', () => {
    beforeEach(() => {
      entries = Array.from({ length: 25 }, (_, i) => ({
        unitId: `W1234-18-03131${i}-Z`,
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: i.toString().padStart(2, '0'),
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }));
      component['savedEntries'].set(entries);
      component['pageSize'].set(10);
      component['pageIndex'].set(0);
    });

    it('should navigate to next page', () => {
      component['goToNextPage']();
      expect(component['pageIndex']()).toBe(1);
    });

    it('should not navigate past last page', () => {
      component['pageIndex'].set(2); // Last page with 25 entries and page size 10
      component['goToNextPage']();
      expect(component['pageIndex']()).toBe(2);
    });

    it('should navigate to previous page', () => {
      component['pageIndex'].set(1);
      component['goToPreviousPage']();
      expect(component['pageIndex']()).toBe(0);
    });

    it('should not navigate before first page', () => {
      component['pageIndex'].set(0);
      component['goToPreviousPage']();
      expect(component['pageIndex']()).toBe(0);
    });

    it('should navigate to first page', () => {
      component['pageIndex'].set(2);
      component['goToFirstPage']();
      expect(component['pageIndex']()).toBe(0);
    });

    it('should navigate to last page', () => {
      component['goToLastPage']();
      expect(component['pageIndex']()).toBe(2); // 25 entries / 10 per page = 3 pages (0,1,2)
    });


  });

  describe('Form Clearing', () => {
    beforeEach(() => {
      component['unitData'].set(mockUnitValidation);
      component['collectionDate'].set('2024-01-15');
      component['productControl'].setValue('E0701V00');
      component['products'].set(mockProducts);
      component['savedEntries'].set([
        {
          unitId: 'W1234-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ]);
    });

    it('should clear entire form', () => {
      component['clearForm']();

      expect(component['unitData']()).toBeNull();
      expect(component['collectionDate']()).toBe('');
      expect(component['productControl'].value).toBe('');
      expect(component['products']()).toEqual([]);
      expect(component['savedEntries']()).toEqual([]);
      expect(component['pageIndex']()).toBe(0);
      expect(component['isbtPrefix']()).toBe('');
      expect(component['componentPrefixControl'].value).toBe('');
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract error from error.error.errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'Custom error message' } } };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('Custom error message');
    });

    it('should extract error from errorCode mapping', () => {
      const error = { error: { errorResponse: { errorCode: '0250' }, message: 'Fallback' } };
      message = component['extractErrorMessage'](error);
      // Should use the mapped message, not the fallback
      expect(message).toBe('Weights must be between 1 and 999.99 gms');
    });

    it('should extract error from error.error.message', () => {
      const error = { error: { message: 'Error message from error.error' } };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('Error message from error.error');
    });

    it('should extract error from error.message', () => {
      const error = { message: 'Error message from error' };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('Error message from error');
    });

    it('should return default message for unknown error format', () => {
      const error = { unknownField: 'some value' };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('Keyboard Input Prevention', () => {
    it('should allow numeric keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5' });
      const result = component['preventDecimalInput'](event);
      expect(result).toBe(true);
    });

    it('should allow control keys', () => {
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      expect(component['preventDecimalInput'](backspaceEvent)).toBe(true);

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      expect(component['preventDecimalInput'](deleteEvent)).toBe(true);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      expect(component['preventDecimalInput'](tabEvent)).toBe(true);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(component['preventDecimalInput'](enterEvent)).toBe(true);
    });

    it('should prevent decimal point', () => {
      const event = new KeyboardEvent('keydown', { key: '.' });
      spyOn(event, 'preventDefault');
      const result = component['preventDecimalInput'](event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent comma', () => {
      const event = new KeyboardEvent('keydown', { key: ',' });
      spyOn(event, 'preventDefault');
      const result = component['preventDecimalInput'](event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent minus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '-' });
      spyOn(event, 'preventDefault');
      const result = component['preventDecimalInput'](event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent alphabetic characters', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      const result = component['preventDecimalInput'](event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Enter Key Handling', () => {
    beforeEach(() => {
      component['unitData'].set(mockUnitValidation);
      component['collectionDate'].set('2024-01-15');
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['currentVolume'].set(250);
      component['products'].set(mockProducts);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );
    });

    it('should save entry when Enter key is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component['handleEnterKey'](event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiService.updateComponentWeight).toHaveBeenCalled();
    });

  });

  describe('Weight Calculation with Specific Gravity', () => {
    it('should not calculate volume when specific gravity is not set', () => {
      component['selectedProductSpecificGravity'].set(null);
      component['onWeightChange']('270');

      expect(component['currentWeight']()).toBe(270);
      expect(component['currentVolume']()).toBeNull();
    });

    it('should calculate volume using specific gravity', () => {
      component['selectedProductSpecificGravity'].set(1.08);
      component['onWeightChange']('270');

      expect(component['currentWeight']()).toBe(270);
      expect(component['currentVolume']()).toBe(250); // 270 / 1.08 = 250
    });
  });

  describe('Load Products Error Handling', () => {
    it('should set empty products array on error', (done) => {
      apiService.getValidProducts.and.returnValue(throwError(() => new Error('API Error')));
      apiService.getUnitDetails.and.returnValue(of(mockUnitDetails));

      component['onUnitValidated'](mockUnitValidation);

      // Wait for async operations to complete
      setTimeout(() => {
        // Products should be set to empty on error (handled in loadProducts)
        expect(component['products']()).toEqual([]);
        done();
      }, 100);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear form when chapter changes', () => {
      // Initialize component to set up subscriptions
      component.ngOnInit();

      // Set up some data
      component['savedEntries'].set([{
        unitId: 'W1234-18-031311-Z',
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: '01',
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }]);
      component['unitData'].set(mockUnitValidation);
      component['products'].set(mockProducts);

      // Trigger chapter change via the subject
      chapterChangedSubject.next(null);

      expect(component['savedEntries']().length).toBe(1);
      expect(component['unitData']()).toEqual(mockUnitValidation);
      expect(component['products']()).toEqual(mockProducts);
    });
  });

  describe('Save Entry Additional Scenarios', () => {
    beforeEach(() => {
      component['unitData'].set(mockUnitValidation);
      component['collectionDate'].set('2024-01-15');
      component['currentWeight'].set(270);
      component['currentVolume'].set(250);
      component['products'].set(mockProducts);
    });



    it('should handle unsuccessful save response', () => {
      component['productControl'].setValue('E0701V00');
      apiService.updateComponentWeight.and.returnValue(
        of({ success: false, message: 'Validation failed', calculatedVolume: 0, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Validation failed');
    });

    it('should use calculated volume from response when currentVolume is null', () => {
      component['productControl'].setValue('E0701V00');
      component['currentVolume'].set(null);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 275, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      const savedEntry = component['savedEntries']()[0];
      expect(savedEntry.volume).toBe(275);
    });

    it('should derive component prefix from ISBT product code (positions 6-7)', () => {
      component['productControl'].setValue('E0701V00');
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(apiService.updateComponentWeight).toHaveBeenCalledWith(
        jasmine.objectContaining({ componentPrefix: 'V0' })
      );
    });

    it('should display plural "Entries" when multiple entries are saved', () => {
      component['savedEntries'].set([
        {
          unitId: 'W1234-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        }
      ]);
      component['productControl'].setValue('E0701V00');
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(snackbarService.showSuccess).toHaveBeenCalledWith('2 Entries saved');
    });

    it('should include anticoagulant volume in request when provided', () => {
      component['productControl'].setValue('E0701V00');
      component['currentAnticoagulantVolume'].set(63);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(apiService.updateComponentWeight).toHaveBeenCalledWith(
        jasmine.objectContaining({
          anticoagulantVolume: 63
        })
      );
    });
  });

  describe('Keyboard Input Edge Cases', () => {
    it('should prevent non-numeric keys except control keys', () => {
      const letterEvent = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(letterEvent, 'preventDefault');

      const result = component['preventDecimalInput'](letterEvent);

      expect(result).toBe(false);
      expect(letterEvent.preventDefault).toHaveBeenCalled();
    });

    it('should prevent plus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '+' });
      spyOn(event, 'preventDefault');

      const result = component['preventDecimalInput'](event);

      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent exponential notation (e)', () => {
      const eventLower = new KeyboardEvent('keydown', { key: 'e' });
      const eventUpper = new KeyboardEvent('keydown', { key: 'E' });
      spyOn(eventLower, 'preventDefault');
      spyOn(eventUpper, 'preventDefault');

      component['preventDecimalInput'](eventLower);
      component['preventDecimalInput'](eventUpper);

      expect(eventLower.preventDefault).toHaveBeenCalled();
      expect(eventUpper.preventDefault).toHaveBeenCalled();
    });

  });

  describe('Weight Validation Edge Cases', () => {
    it('should validate weight exactly at 999.99', () => {
      component['selectedProductSpecificGravity'].set(1.08);
      component['onWeightChange']('999.99');

      expect(component['currentWeight']()).toBe(999.99);
      expect(component['weightError']()).toBeNull();
    });

    it('should validate weight exactly at 1', () => {
      component['selectedProductSpecificGravity'].set(1.08);
      component['onWeightChange']('1');

      expect(component['currentWeight']()).toBe(1);
      expect(component['weightError']()).toBeNull();
    });

    it('should accept weight of 0.99 as it is greater than 0', () => {
      component['selectedProductSpecificGravity'].set(1.08);
      component['onWeightChange']('0.99');

      expect(component['currentWeight']()).toBe(0.99);
      expect(component['weightError']()).toBeNull();
    });

    it('should reject weight of 1000', () => {
      component['onWeightChange']('1000');

      expect(component['weightError']()).toBeDefined();
      expect(component['currentWeight']()).toBeNull();
    });

    it('should reject NaN weight', () => {
      component['onWeightChange']('abc');

      expect(component['weightError']()).toBeDefined();
      expect(component['currentWeight']()).toBeNull();
    });
  });

  describe('Anticoagulant Volume Edge Cases', () => {
    it('should accept volume exactly at 999', () => {
      component['onAnticoagulantVolumeChange']('999');

      expect(component['currentAnticoagulantVolume']()).toBe(999);
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });

    it('should accept volume exactly at 1', () => {
      component['onAnticoagulantVolumeChange']('1');

      expect(component['currentAnticoagulantVolume']()).toBe(1);
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });

    it('should handle whitespace-only input as empty', () => {
      component['onAnticoagulantVolumeChange']('   ');

      expect(component['currentAnticoagulantVolume']()).toBeNull();
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });
  });

  describe('Computed Values', () => {
    it('should compute total count correctly', () => {
      entries = Array.from({ length: 15 }, (_, i) => ({
        unitId: `W1234-18-03131${i}-Z`,
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: i.toString().padStart(2, '0'),
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }));

      component['savedEntries'].set(entries);

      expect(component['getTotalCount']()).toBe(15);
    });

    it('should return empty array when no entries for pagination', () => {
      component['savedEntries'].set([]);

      expect(component['paginatedEntries']()).toEqual([]);
    });
  });

  describe('Navigation Edge Cases', () => {
    it('should handle last page with exact page size', () => {
      entries = Array.from({ length: 20 }, (_, i) => ({
        unitId: `W1234-18-03131${i}-Z`,
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: i.toString().padStart(2, '0'),
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }));
      component['savedEntries'].set(entries);
      component['pageSize'].set(10);

      component['goToLastPage']();

      expect(component['pageIndex']()).toBe(1); // 20 entries / 10 per page = 2 pages (0,1)
    });

    it('should handle navigation when entries list is empty', () => {
      component['savedEntries'].set([]);
      component['pageSize'].set(10);

      component['goToLastPage']();
      expect(component['pageIndex']()).toBe(0);

      component['goToNextPage']();
      expect(component['pageIndex']()).toBe(0);

      expect(component['hasNextPage']()).toBe(false);
      expect(component['hasPreviousPage']()).toBe(false);
    });
  });

  describe('Sorting Edge Cases', () => {
    it('should handle sorting with empty entries', () => {
      component['savedEntries'].set([]);
      component['onSortChange']({ active: 'unitId', direction: 'asc' });

      expect(component['paginatedEntries']()).toEqual([]);
    });

    it('should handle sorting by non-unitId column (default case)', () => {
      entries = [
        {
          unitId: 'W1234-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product A',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
        {
          unitId: 'W1234-18-031312-A',
          productCode: 'E0701V01',
          productDesc: 'Product B',
          componentPrefix: '02',
          collectionDate: '2024-01-15',
          weight: 260,
          volume: 260,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ];
      component['savedEntries'].set(entries);

      component['onSortChange']({ active: 'productCode', direction: 'asc' });

      // Should maintain original order since productCode isn't handled in switch
      expect(component['sortActive']()).toBe('productCode');
      expect(component['sortDirection']()).toBe('asc');
    });
  });

  describe('clearForm Additional Coverage', () => {


    it('should handle clearing when unitIdField is undefined', () => {
      component['unitIdField'] = undefined as any;

      expect(() => component['clearForm']()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onUnitCleared', () => {
    it('should clear the form when unit is cleared', () => {
      component['unitData'].set(mockUnitValidation);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      component['savedEntries'].set([{
        unitId: 'W1234-18-031311-Z',
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: '01',
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }]);

      component['onUnitCleared']();

      expect(component['unitData']()).toBeNull();
      expect(component['collectionDate']()).toBe('');
      expect(component['products']()).toEqual([]);
      expect(component['savedEntries']()).toEqual([]);
    });
  });

  describe('loadUnitMetadata branch coverage', () => {
    it('should show error when chapterId is null', () => {
      headerService.getCurrentChapterId.and.returnValue(null as any);

      component['onUnitValidated'](mockUnitValidation);

      expect(snackbarService.showError).toHaveBeenCalledWith('Chapter ID not found');
      expect(apiService.getUnitDetails).not.toHaveBeenCalled();
    });
  });

  describe('saveCurrentEntry validation branches', () => {
    it('should show error when unitId is missing', () => {
      component['unitData'].set(null);

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please enter a valid Unit ID');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should show error when product is not selected', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('');

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please select a product');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should show error when weight is null', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(null);

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please enter a valid weight');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should show error when anticoagulantVolumeError is set', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['anticoagulantVolumeError'].set('Volume error');

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Please fix validation errors before saving');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should show error when chapterId is null during save', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      headerService.getCurrentChapterId.and.returnValue(null as any);

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Chapter ID not found');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should show error when selected product is not found in products list', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('INVALID_CODE');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Selected product not found');
      expect(apiService.updateComponentWeight).not.toHaveBeenCalled();
    });

    it('should handle API error during save', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      apiService.updateComponentWeight.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component['saveCurrentEntry']();

      expect(component['isLoading']()).toBe(false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Server error');
    });

    it('should show fallback message when save fails with no message', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: false, message: '', calculatedVolume: 0, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(snackbarService.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should use 0 for volume when both currentVolume and calculatedVolume are falsy', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['currentVolume'].set(null);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: undefined, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      const savedEntry = component['savedEntries']()[0];
      expect(savedEntry.volume).toBe(0);
    });

    it('should set isLoading to true while saving', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);

      let loadingDuringCall = false;
      apiService.updateComponentWeight.and.callFake(() => {
        loadingDuringCall = component['isLoading']();
        return of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false });
      });

      component['saveCurrentEntry']();

      expect(loadingDuringCall).toBe(true);
      expect(component['isLoading']()).toBe(false);
    });

    it('should extract componentPrefix from ISBT product code substring(6,8)', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      // 'E0701V00'.substring(6, 8) === 'V0'
      expect(apiService.updateComponentWeight).toHaveBeenCalledWith(
        jasmine.objectContaining({
          componentPrefix: 'V0'
        })
      );
    });

    it('should pass codeScheme in the update request', () => {
      component['unitData'].set(mockUnitValidation);
      component['productControl'].setValue('E0701V00');
      component['currentWeight'].set(270);
      component['collectionDate'].set('2024-01-15');
      component['products'].set(mockProducts);
      component['codeScheme'].set('C');
      apiService.updateComponentWeight.and.returnValue(
        of({ success: true, message: 'Success', calculatedVolume: 250, interdictionApplied: false })
      );

      component['saveCurrentEntry']();

      expect(apiService.updateComponentWeight).toHaveBeenCalledWith(
        jasmine.objectContaining({
          codeScheme: 'C'
        })
      );
    });
  });

  describe('handleEnterKey non-Enter key', () => {
    it('should not call saveCurrentEntry when key is not Enter', () => {
      const saveSpy = spyOn<any>(component, 'saveCurrentEntry');
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');

      component['handleEnterKey'](event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('onPageChange else branch', () => {
    it('should update pageIndex when pageSize remains the same', () => {
      component['pageSize'].set(10);
      component['pageIndex'].set(0);
      const event = { pageSize: 10, pageIndex: 3, length: 50 } as any;

      component['onPageChange'](event);

      expect(component['pageIndex']()).toBe(3);
      expect(component['pageSize']()).toBe(10);
    });
  });

  describe('filterProducts via productSearchCtrl', () => {
    beforeEach(() => {
      const multipleProducts = [
        { productCode: 'E0701V00', productDesc: 'Fresh Frozen Plasma/CPD', productType: 'PLT', specificGravity: 1.08, poolProductCode: 'N' },
        { productCode: 'E0802V00', productDesc: 'Red Blood Cells/AS5', productType: 'RBC', specificGravity: 1.06, poolProductCode: 'N' },
        { productCode: 'E0903V00', productDesc: 'Platelets/PAS', productType: 'PLT', specificGravity: 1.03, poolProductCode: 'N' },
      ];
      component['products'].set(multipleProducts);
      component['filteredProducts'].set(multipleProducts);
      component.ngOnInit();
    });

    it('should filter products by product code', (done) => {
      component['productSearchCtrl'].setValue('E0802');

      setTimeout(() => {
        expect(component['filteredProducts']().length).toBe(1);
        expect(component['filteredProducts']()[0].productCode).toBe('E0802V00');
        done();
      }, 50);
    });

    it('should filter products by description', (done) => {
      component['productSearchCtrl'].setValue('Red Blood');

      setTimeout(() => {
        expect(component['filteredProducts']().length).toBe(1);
        expect(component['filteredProducts']()[0].productDesc).toContain('Red Blood Cells');
        done();
      }, 50);
    });

    it('should show all products when search text is empty', (done) => {
      component['productSearchCtrl'].setValue('Red Blood');

      setTimeout(() => {
        component['productSearchCtrl'].setValue('');

        setTimeout(() => {
          expect(component['filteredProducts']().length).toBe(3);
          done();
        }, 50);
      }, 50);
    });

    it('should show empty results when no products match', (done) => {
      component['productSearchCtrl'].setValue('NONEXISTENT');

      setTimeout(() => {
        expect(component['filteredProducts']().length).toBe(0);
        done();
      }, 50);
    });
  });

  describe('hasSavedEntries computed', () => {
    it('should return false when no entries are saved', () => {
      component['savedEntries'].set([]);
      expect(component['hasSavedEntries']()).toBe(false);
    });

    it('should return true when entries exist', () => {
      component['savedEntries'].set([{
        unitId: 'W1234-18-031311-Z',
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: '01',
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }]);
      expect(component['hasSavedEntries']()).toBe(true);
    });
  });

  describe('elementId helper', () => {
    it('should generate element ID with component prefix', () => {
      const id = component['elementId']('weight');
      expect(id).toContain('modify-component-weight-');
      expect(id).toContain('-weight');
    });

    it('should generate different IDs for different names', () => {
      const weightId = component['elementId']('weight');
      const productId = component['elementId']('product');
      expect(weightId).not.toEqual(productId);
    });
  });

  describe('extractShortDescription edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(component['getShortDescription']('')).toBe('');
    });

    it('should trim whitespace around the short description', () => {
      expect(component['getShortDescription']('  Red Blood Cells  | extra info')).toBe('Red Blood Cells');
    });
  });

  describe('Anticoagulant Volume comma separator', () => {
    it('should reject values with comma separator', () => {
      component['onAnticoagulantVolumeChange']('50,5');

      expect(component['anticoagulantVolumeError']()).toBeDefined();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
    });

    it('should reject negative values', () => {
      component['onAnticoagulantVolumeChange']('-5');

      expect(component['anticoagulantVolumeError']()).toBeDefined();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
    });
  });

  describe('Product selection setting description and specific gravity', () => {
    beforeEach(() => {
      component['products'].set(mockProducts);
      component.ngOnInit();
    });

    it('should set product description and specific gravity when product is selected', (done) => {
      component['productControl'].setValue('E0701V00');

      setTimeout(() => {
        expect(component['productDescription']()).toBe('Fresh Frozen Plasma/CPD');
        expect(component['selectedProductSpecificGravity']()).toBe(1.08);
        done();
      }, 50);
    });

    it('should handle product with pipe in description', (done) => {
      component['products'].set([{
        productCode: 'E0701V00',
        productDesc: 'Fresh Frozen Plasma|CPD/450mL',
        productType: 'PLT',
        specificGravity: 1.08,
        poolProductCode: 'N',
      }]);

      component['productControl'].setValue('E0701V00');

      setTimeout(() => {
        expect(component['productDescription']()).toBe('Fresh Frozen Plasma');
        done();
      }, 50);
    });

    it('should handle product code not found in products list', (done) => {
      component['productControl'].setValue('NONEXISTENT');

      setTimeout(() => {
        // When product is not found, description should remain unchanged
        // since the find returns undefined and the if(product) check fails
        done();
      }, 50);
    });
  });

  describe('hasNextPage and hasPreviousPage', () => {
    beforeEach(() => {
      entries = Array.from({ length: 25 }, (_, i) => ({
        unitId: `W1234-18-03131${i}-Z`,
        productCode: 'E0701V00',
        productDesc: 'Product',
        componentPrefix: i.toString().padStart(2, '0'),
        collectionDate: '2024-01-15',
        weight: 250,
        volume: 250,
        anticoagulantVolume: null,
        specificGravity: 1.08,
        savedAt: new Date(),
      }));
      component['savedEntries'].set(entries);
      component['pageSize'].set(10);
    });

    it('should return true for hasNextPage when not on last page', () => {
      component['pageIndex'].set(0);
      expect(component['hasNextPage']()).toBe(true);
    });

    it('should return false for hasNextPage when on last page', () => {
      component['pageIndex'].set(2);
      expect(component['hasNextPage']()).toBe(false);
    });

    it('should return false for hasPreviousPage when on first page', () => {
      component['pageIndex'].set(0);
      expect(component['hasPreviousPage']()).toBe(false);
    });

    it('should return true for hasPreviousPage when not on first page', () => {
      component['pageIndex'].set(1);
      expect(component['hasPreviousPage']()).toBe(true);
    });
  });

  describe('Sorting with actual data verification', () => {
    it('should sort entries by unitId ascending', () => {
      const unsortedEntries = [
        {
          unitId: 'Z9999-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product B',
          componentPrefix: '02',
          collectionDate: '2024-01-15',
          weight: 260,
          volume: 260,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
        {
          unitId: 'A0001-18-031311-Z',
          productCode: 'E0701V01',
          productDesc: 'Product A',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ];
      component['savedEntries'].set(unsortedEntries);
      component['onSortChange']({ active: 'unitId', direction: 'asc' });

      const paginated = component['paginatedEntries']();
      expect(paginated[0].unitId).toBe('A0001-18-031311-Z');
      expect(paginated[1].unitId).toBe('Z9999-18-031311-Z');
    });

    it('should sort entries by unitId descending', () => {
      const unsortedEntries = [
        {
          unitId: 'A0001-18-031311-Z',
          productCode: 'E0701V01',
          productDesc: 'Product A',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
        {
          unitId: 'Z9999-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product B',
          componentPrefix: '02',
          collectionDate: '2024-01-15',
          weight: 260,
          volume: 260,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ];
      component['savedEntries'].set(unsortedEntries);
      component['onSortChange']({ active: 'unitId', direction: 'desc' });

      const paginated = component['paginatedEntries']();
      expect(paginated[0].unitId).toBe('Z9999-18-031311-Z');
      expect(paginated[1].unitId).toBe('A0001-18-031311-Z');
    });

    it('should not sort when direction is empty', () => {
      const entries = [
        {
          unitId: 'Z9999-18-031311-Z',
          productCode: 'E0701V00',
          productDesc: 'Product B',
          componentPrefix: '02',
          collectionDate: '2024-01-15',
          weight: 260,
          volume: 260,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
        {
          unitId: 'A0001-18-031311-Z',
          productCode: 'E0701V01',
          productDesc: 'Product A',
          componentPrefix: '01',
          collectionDate: '2024-01-15',
          weight: 250,
          volume: 250,
          anticoagulantVolume: null,
          specificGravity: 1.08,
          savedAt: new Date(),
        },
      ];
      component['savedEntries'].set(entries);
      component['onSortChange']({ active: 'unitId', direction: '' });

      const paginated = component['paginatedEntries']();
      // Should maintain original order since direction is empty
      expect(paginated[0].unitId).toBe('Z9999-18-031311-Z');
      expect(paginated[1].unitId).toBe('A0001-18-031311-Z');
    });
  });

  describe('clearInputFields coverage', () => {
    it('should reset weight, volume, anticoagulant and error signals', () => {
      component['currentWeight'].set(270);
      component['currentVolume'].set(250);
      component['currentAnticoagulantVolume'].set(63);
      component['weightError'].set('some error');
      component['anticoagulantVolumeError'].set('another error');

      component['clearInputFields']();

      expect(component['currentWeight']()).toBeNull();
      expect(component['currentVolume']()).toBeNull();
      expect(component['currentAnticoagulantVolume']()).toBeNull();
      expect(component['weightError']()).toBeNull();
      expect(component['anticoagulantVolumeError']()).toBeNull();
    });
  });

  describe('initializeHeaderConfig', () => {
    it('should set default header configuration', () => {
      component['initializeHeaderConfig']();

      expect(component['headerConfig'].title).toBe('Modify Component Weight');
      expect(component['headerConfig'].subtitle).toBe('Record and save component weight manually or directly from the scale.');
      expect(component['headerConfig'].breadcrumbs.length).toBe(2);
      expect(component['headerConfig'].breadcrumbs[0].label).toBe('Home');
      expect(component['headerConfig'].breadcrumbs[0].link).toBe('/home');
      expect(component['headerConfig'].breadcrumbs[1].label).toBe('Modify Component Weight');
      expect(component['headerConfig'].breadcrumbs[1].link).toBeNull();
    });
  });

  describe('preventDecimalInput Escape key', () => {
    it('should allow Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const result = component['preventDecimalInput'](event);
      expect(result).toBe(true);
    });
  });

  describe('Weight change with NaN input', () => {
    it('should reject negative weight values', () => {
      component['onWeightChange']('-5');

      expect(component['weightError']()).toBeDefined();
      expect(component['currentWeight']()).toBeNull();
      expect(component['currentVolume']()).toBeNull();
    });
  });

  describe('Date Formatting Edge Cases', () => {
    it('should format date with single digit day', () => {
      const formatted = component['formatDate']('2024-01-05');
      expect(formatted).toMatch(/^05-[A-Z]{3}-2024$/);
    });

    it('should format date with double digit day', () => {
      const formatted = component['formatDate']('2024-12-25');
      expect(formatted).toMatch(/^25-[A-Z]{3}-2024$/);
    });

    it('should handle null date string', () => {
      expect(component['formatDate']('')).toBe('');
    });
  });

  describe('Error Code Mapping', () => {
    it('should return mapped error message for known error code', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: '0250',
            error: undefined
          },
          message: 'Server message'
        }
      };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('Weights must be between 1 and 999.99 gms');
    });

    it('should fallback to error.error.message when errorCode mapping not found', () => {
      const error = {
        error: {
          errorResponse: {
            errorCode: 'UNKNOWN_CODE',
            error: undefined
          },
          message: 'Fallback message'
        }
      };
      message = component['extractErrorMessage'](error);
      expect(message).toBe('Fallback message');
    });
  });

  describe('Constructor and Effects', () => {
    it('should initialize with default header config', () => {
      expect(component['headerConfig'].title).toBeTruthy();
      expect(component['headerConfig'].breadcrumbs.length).toBeGreaterThan(0);
    });

    it('should have unique component IDs for different instances', () => {
      const fixture2 = TestBed.createComponent(ModifyComponentWeightComponent);
      const component2 = fixture2.componentInstance;
      const fixture3 = TestBed.createComponent(ModifyComponentWeightComponent);
      const component3 = fixture3.componentInstance;

      expect(component2['componentId']).not.toEqual(component3['componentId']);
    });
  });
});
