import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ComponentNotesComponent } from './component-notes';
import { ComponentNotesApiService } from './services/component-notes-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { FIELD_LENGTHS } from './models/component-notes.model';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ComponentNotesComponent', () => {
  let component: ComponentNotesComponent;
  let fixture: ComponentFixture<ComponentNotesComponent>;
  let apiServiceSpy: jasmine.SpyObj<ComponentNotesApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let loggingSpy: jasmine.SpyObj<LoggingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChanged$: Subject<void>;

  const mockUnitValidationEvent: UnitValidationResponse = {
    parsedUnitId: 'W1234567890123',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W1234567890123',
    codabarUnitScheme: null,
    entryMode: 'M',
    barcodeType: 'CODE128',
    chapterScheme: 'I'
  };

  const mockValidateUnitResponse = {
    unitId: 'W1234567890123',
    collDate: '2026-01-15',
    isValid: true,
    hasComponents: true,
    componentCount: 3
  };

  const mockProducts = [
    { productCode: 'RBC', productDesc: 'Red Blood Cells' },
    { productCode: 'PLT', productDesc: 'Platelets' },
    { productCode: 'FFP', productDesc: 'Fresh Frozen Plasma' }
  ];

  const mockPrefixes = [{ componentPrefix: '01' }];

  const mockNoteData = {
    unitId: 'W1234567890123',
    collDate: '2026-01-15',
    productCode: 'RBC',
    componentPrefix: '01',
    noteId: 'N001',
    note: 'Existing component note'
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ComponentNotesApiService', [
      'validateUnit', 'getProducts', 'getComponentPrefixes', 'getNote', 'saveNote'
    ]);

    snackbarSpy = createMockSnackbarService();

    loggingSpy = jasmine.createSpyObj('LoggingService', [
      'debug', 'error', 'warn', 'log'
    ]);

    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getTitle', 'getSubtitle'
    ], {
      pageHeaderData: jasmine.createSpy().and.returnValue(undefined)
    });



      TestBed.configureTestingModule({
      imports: [
        ComponentNotesComponent,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ComponentNotesApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } }
      ]
    });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getProducts.calls.reset();


      apiServiceSpy.getComponentPrefixes.calls.reset();


      apiServiceSpy.getNote.calls.reset();


      apiServiceSpy.saveNote.calls.reset();


      loggingSpy.debug.calls.reset();


      loggingSpy.error.calls.reset();


      loggingSpy.warn.calls.reset();


      loggingSpy.log.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentWarehouseId.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


    fixture = TestBed.createComponent(ComponentNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Initial State', () => {


    it('should have empty form state', () => {
      const state = component.formState();
      expect(state.unitId).toBe('');
      expect(state.isUnitValidated).toBeFalse();
      expect(state.isProductSelected).toBeFalse();
    });



    it('should not be able to retrieve', () => {
      expect(component.canRetrieve()).toBeFalse();
    });

    it('should not be able to save', () => {
      expect(component.canSave()).toBeFalse();
    });

    it('should have max characters remaining', () => {
      expect(component.charsRemaining()).toBe(FIELD_LENGTHS.NOTE_MAX);
    });


  });

  describe('onUnitValidated', () => {
    it('should validate unit and load products on success', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W1234567890123');
      expect(apiServiceSpy.getProducts).toHaveBeenCalledWith('W1234567890123', '2026-01-15');
      expect(component.formState().isUnitValidated).toBeTrue();
      expect(component.formState().unitId).toBe('W1234567890123');
      expect(component.availableProducts().length).toBe(3);
      expect(component.filteredProducts().length).toBe(3);
      expect(component.viewState()).toBe('unit-loaded');
      expect(component.loading()).toBeFalse();
    }));

    it('should show error when unit has no components', fakeAsync(() => {
      const noComponentsResponse = { ...mockValidateUnitResponse, hasComponents: false };
      apiServiceSpy.validateUnit.and.returnValue(of(noComponentsResponse));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(
        'No acceptable components have been made from this unit'
      );
      expect(component.loading()).toBeFalse();
      expect(component.viewState()).toBe('initial');
    }));

    it('should show info when no products found', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of([]));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('No products found for this unit');
    }));

    it('should handle unit validation API error', fakeAsync(() => {
      const error: any = new Error('Unit not found');
      error.errorCode = 'ERR_404';
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => error));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('ERR_404: Unit not found');
      expect(component.loading()).toBeFalse();
      expect(component.viewState()).toBe('initial');
    }));

    it('should handle unit validation error without errorCode', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network error');
    }));

    it('should handle getProducts API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(throwError(() => new Error('Products failed')));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to retrieve products for this unit');
      expect(component.loading()).toBeFalse();
    }));

    it('should set loading to false after processing completes', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.formState().isUnitValidated).toBeTrue();
    }));
  });

  describe('onProductChange', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should update form state with selected product', () => {
      component.onProductChange('RBC');

      expect(component.formState().productCode).toBe('RBC');
      expect(component.formState().productDescription).toBe('Red Blood Cells');
      expect(component.formState().isProductSelected).toBeTrue();
    });



    it('should not update if product code not found', () => {
      component.onProductChange('INVALID');

      expect(component.formState().productCode).toBe('');
      expect(component.formState().isProductSelected).toBeFalse();
    });

    it('should enable retrieve after product selection', () => {
      component.onProductChange('RBC');
      expect(component.canRetrieve()).toBeTrue();
    });
  });

  describe('onRetrieve', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');
    }));

    it('should retrieve component prefix and existing note', fakeAsync(() => {
      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(mockNoteData));

      component.onRetrieve();
      tick();

      expect(component.formState().componentPrefix).toBe('01');
      expect(component.noteText()).toBe('Existing component note');
      expect(component.originalNote()).toBe('Existing component note');
      expect(component.viewState()).toBe('note-form');
      expect(component.loading()).toBeFalse();
    }));

    it('should use default prefix "00" when no prefixes returned', fakeAsync(() => {
      apiServiceSpy.getComponentPrefixes.and.returnValue(of([]));
      apiServiceSpy.getNote.and.returnValue(of(null));

      component.onRetrieve();
      tick();

      expect(component.formState().componentPrefix).toBe('00');
      expect(component.noteText()).toBe('');
      expect(component.viewState()).toBe('note-form');
    }));






  });

  describe('onSave', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(null));
      component.onRetrieve();
      tick();
    }));

    it('should save note and show success message', fakeAsync(() => {
      apiServiceSpy.saveNote.and.returnValue(of({ noteId: 'N001', message: 'Saved' }));
      component.noteText.set('New note content');

      component.onSave();
      tick();

      expect(apiServiceSpy.saveNote).toHaveBeenCalledWith({
        unitId: 'W1234567890123',
        collDate: '2026-01-15',
        productCode: 'RBC',
        componentPrefix: '01',
        note: 'New note content'
      });
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Saved');
    }));









    it('should trim note text before saving', fakeAsync(() => {
      apiServiceSpy.saveNote.and.returnValue(of({ noteId: 'N001', message: 'Saved' }));
      component.noteText.set('  Note with spaces  ');

      component.onSave();
      tick();

      expect(apiServiceSpy.saveNote).toHaveBeenCalledWith(
        jasmine.objectContaining({ note: 'Note with spaces' })
      );
    }));
  });

  describe('onCancel', () => {
    it('should reset note and switch to unit-loaded view', () => {
      component.noteText.set('some text');
      component.viewState.set('note-form');

      component.onCancel();

      expect(component.noteText()).toBe('');
      expect(component.originalNote()).toBe('');
      expect(component.viewState()).toBe('unit-loaded');
    });
  });

  describe('onClearAll', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');
    }));

    it('should reset all state to initial', () => {
      component.onClearAll();

      expect(component.viewState()).toBe('initial');
      expect(component.formState().unitId).toBe('');
      expect(component.formState().isUnitValidated).toBeFalse();
      expect(component.availableProducts()).toEqual([]);
      expect(component.filteredProducts()).toEqual([]);
      expect(component.noteText()).toBe('');
      expect(component.originalNote()).toBe('');
      expect(component.loading()).toBeFalse();
      expect(component.saving()).toBeFalse();
    });
  });
  describe('onNoteInput', () => {
    it('should update note text within max length', () => {
      component.onNoteInput('Hello world');
      expect(component.noteText()).toBe('Hello world');
    });

    it('should not update note text beyond max length', () => {
      const longText = 'a'.repeat(FIELD_LENGTHS.NOTE_MAX + 1);
      component.onNoteInput(longText);
      expect(component.noteText()).toBe('');
    });

    it('should allow text at exactly max length', () => {
      const maxText = 'a'.repeat(FIELD_LENGTHS.NOTE_MAX);
      component.onNoteInput(maxText);
      expect(component.noteText()).toBe(maxText);
    });
  });

  describe('Computed properties', () => {
    it('unitFound should reflect isUnitValidated', () => {
      expect(component.unitFound()).toBeFalse();

      component.formState.update(s => ({ ...s, isUnitValidated: true }));
      expect(component.unitFound()).toBeTrue();
    });

    it('canRetrieve should require validated unit, selected product, and not loading', () => {
      expect(component.canRetrieve()).toBeFalse();

      component.formState.update(s => ({
        ...s, isUnitValidated: true, isProductSelected: true
      }));
      expect(component.canRetrieve()).toBeTrue();

      component.loading.set(true);
      expect(component.canRetrieve()).toBeFalse();
    });

    it('canSave should require non-empty note and not saving', () => {
      expect(component.canSave()).toBeFalse();

      component.noteText.set('Some note');
      expect(component.canSave()).toBeTrue();

      component.saving.set(true);
      expect(component.canSave()).toBeFalse();
    });




  });

  describe('formatCollectionDate', () => {


    it('should format ISO date to display format', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      const result = component.formatCollectionDate();
      expect(result).toMatch(/^\d{2}-[A-Z][a-z]{2}-\d{4}$/);
    }));

    it('should return dash when no collection date set', () => {
      const result = component.formatCollectionDate();
      expect(result).toBe('-');
    });
  });

  describe('filterProducts', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should filter products by product code', () => {
      component.productSearchControl.setValue('RBC');

      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('RBC');
    });

    it('should filter products by description', () => {
      component.productSearchControl.setValue('Plasma');

      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].productCode).toBe('FFP');
    });

    it('should show all products when search term is empty', () => {
      component.productSearchControl.setValue('RBC');
      expect(component.filteredProducts().length).toBe(1);

      component.productSearchControl.setValue('');
      expect(component.filteredProducts().length).toBe(3);
    });

    it('should return empty array when no products match', () => {
      component.productSearchControl.setValue('ZZZZZ');
      expect(component.filteredProducts().length).toBe(0);
    });

    it('should filter case-insensitively', () => {
      component.productSearchControl.setValue('rbc');
      expect(component.filteredProducts().length).toBe(1);
    });
  });

  describe('onRetrieve - error handling', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');
    }));

    it('should show error when getting component prefixes fails', fakeAsync(() => {
      apiServiceSpy.getComponentPrefixes.and.returnValue(
        throwError(() => new Error('Prefix fetch failed'))
      );

      component.onRetrieve();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to retrieve component data');
      expect(component.loading()).toBeFalse();
    }));

    it('should still show note form when getNote fails', fakeAsync(() => {
      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(throwError(() => new Error('Note fetch failed')));

      component.onRetrieve();
      tick();

      expect(component.noteText()).toBe('');
      expect(component.viewState()).toBe('note-form');
    }));

    it('should not retrieve when unit is not validated', () => {
      component.formState.update(s => ({ ...s, isUnitValidated: false }));

      component.onRetrieve();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a Unit ID and Product Code');
      expect(apiServiceSpy.getComponentPrefixes).not.toHaveBeenCalled();
    });
  });

  describe('onSave - error handling', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(null));
      component.onRetrieve();
      tick();
    }));

    it('should show error message on save failure', fakeAsync(() => {
      const error: any = new Error('Save failed');
      apiServiceSpy.saveNote.and.returnValue(throwError(() => error));
      component.noteText.set('New note content');

      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Save failed');
      expect(component.saving()).toBeFalse();
    }));

    it('should show default error when save error has no message', fakeAsync(() => {
      apiServiceSpy.saveNote.and.returnValue(throwError(() => ({})));
      component.noteText.set('New note content');

      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save component note');
    }));

    it('should not save when note text is empty', fakeAsync(() => {
      component.noteText.set('');

      component.onSave();
      tick();

      expect(apiServiceSpy.saveNote).not.toHaveBeenCalled();
    }));

    it('should not save when note text is only whitespace', fakeAsync(() => {
      component.noteText.set('   ');

      component.onSave();
      tick();

      expect(apiServiceSpy.saveNote).not.toHaveBeenCalled();
    }));

    it('should clear form after successful save', fakeAsync(() => {
      apiServiceSpy.saveNote.and.returnValue(of({ noteId: 'N001', message: 'Saved' }));
      component.noteText.set('New note');

      component.onSave();
      tick();

      expect(component.viewState()).toBe('initial');
      expect(component.formState().unitId).toBe('');
      expect(component.noteText()).toBe('');
    }));
  });

  describe('formatProductDescription', () => {
    it('should remove pipe suffix from description', () => {
      const result = component.formatProductDescription('Red Blood Cells|Additional Info');
      expect(result).toBe('Red Blood Cells');
    });

    it('should return full description when no pipe present', () => {
      const result = component.formatProductDescription('Red Blood Cells');
      expect(result).toBe('Red Blood Cells');
    });

    it('should return empty string for empty input', () => {
      const result = component.formatProductDescription('');
      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = component.formatProductDescription(null as any);
      expect(result).toBe('');
    });
  });

  describe('onUnitCleared', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should reset to initial state', () => {
      component.onUnitCleared();

      expect(component.formState().unitId).toBe('');
      expect(component.formState().isUnitValidated).toBeFalse();
      expect(component.viewState()).toBe('initial');
      expect(component.availableProducts()).toEqual([]);
    });
  });

  describe('showEmptyState', () => {
    it('should show empty state in initial view', () => {
      expect(component.showEmptyState()).toBeTrue();
    });

    it('should show empty state in unit-loaded view', () => {
      component.viewState.set('unit-loaded');
      expect(component.showEmptyState()).toBeTrue();
    });

    it('should not show empty state in note-form view', () => {
      component.viewState.set('note-form');
      expect(component.showEmptyState()).toBeFalse();
    });
  });

  describe('charsRemaining', () => {
    it('should decrease as note text changes', () => {
      expect(component.charsRemaining()).toBe(FIELD_LENGTHS.NOTE_MAX);

      component.noteText.set('Hello');
      expect(component.charsRemaining()).toBe(FIELD_LENGTHS.NOTE_MAX - 5);
    });

    it('should be zero at max length', () => {
      component.noteText.set('a'.repeat(FIELD_LENGTHS.NOTE_MAX));
      expect(component.charsRemaining()).toBe(0);
    });
  });

  describe('chapter change subscription', () => {
    it('should clear form when chapter changes', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(component.formState().isUnitValidated).toBeTrue();

      chapterChanged$.next();

      expect(component.formState().unitId).toBe('');
      expect(component.formState().isUnitValidated).toBeFalse();
      expect(component.viewState()).toBe('initial');
      expect(component.availableProducts()).toEqual([]);
      expect(component.noteText()).toBe('');
    }));
  });

  describe('loading state transitions', () => {
    it('should have loading false after unit validation completes', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.formState().isUnitValidated).toBeTrue();
    }));

    it('should have loading false after retrieve completes', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(mockNoteData));

      component.onRetrieve();
      tick();

      expect(component.loading()).toBeFalse();
      expect(component.viewState()).toBe('note-form');
    }));

    it('should have saving false after save completes', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(null));
      component.onRetrieve();
      tick();

      apiServiceSpy.saveNote.and.returnValue(of({ noteId: 'N001', message: 'Saved' }));
      component.noteText.set('New note');

      component.onSave();
      tick();

      expect(component.saving()).toBeFalse();
    }));

    it('should reset loading on unit validation error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => new Error('fail')));

      component.onUnitValidated(mockUnitValidationEvent);
      tick();

      expect(component.loading()).toBeFalse();
    }));

    it('should reset saving on save error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(null));
      component.onRetrieve();
      tick();

      apiServiceSpy.saveNote.and.returnValue(throwError(() => new Error('Save failed')));
      component.noteText.set('Note');

      component.onSave();
      tick();

      expect(component.saving()).toBeFalse();
    }));
  });

  describe('onRetrieve - product not selected guard', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should not retrieve when product is not selected', () => {
      component.onRetrieve();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a Unit ID and Product Code');
      expect(apiServiceSpy.getComponentPrefixes).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll details', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');
      component.productSearchControl.setValue('RBC');
    }));

    it('should reset productSearchControl on clearAll', () => {
      component.onClearAll();
      expect(component.productSearchControl.value).toBe('');
    });

    it('should reset loading and saving signals on clearAll', () => {
      component.loading.set(true);
      component.saving.set(true);

      component.onClearAll();

      expect(component.loading()).toBeFalse();
      expect(component.saving()).toBeFalse();
    });
  });

  describe('onSave - error with errorCode', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
      component.onProductChange('RBC');

      apiServiceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
      apiServiceSpy.getNote.and.returnValue(of(null));
      component.onRetrieve();
      tick();
    }));

    it('should display error message from error object', fakeAsync(() => {
      const error: any = new Error('Component not found');
      error.errorCode = 'ERR_0151';
      apiServiceSpy.saveNote.and.returnValue(throwError(() => error));
      component.noteText.set('Some note');

      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Component not found');
    }));
  });

  describe('onProductChange edge cases', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should reset view to unit-loaded and clear note when changing product', () => {
      component.viewState.set('note-form');
      component.noteText.set('existing note');

      component.onProductChange('PLT');

      expect(component.viewState()).toBe('unit-loaded');
      expect(component.noteText()).toBe('');
      expect(component.originalNote()).toBe('');
    });

    it('should not modify state when called with empty string', () => {
      component.onProductChange('RBC');
      expect(component.formState().isProductSelected).toBeTrue();

      component.onProductChange('');
      expect(component.formState().productCode).toBe('RBC');
    });
  });

  describe('filterProducts edge case', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
      apiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      component.onUnitValidated(mockUnitValidationEvent);
      tick();
    }));

    it('should filter by partial product description', () => {
      component.productSearchControl.setValue('Blood');
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].productCode).toBe('RBC');
    });

    it('should handle whitespace-only search term as empty', () => {
      component.productSearchControl.setValue('   ');
      expect(component.filteredProducts().length).toBe(3);
    });
  });

  describe('canRetrieve with loading state', () => {
    it('should be false when loading is true even if unit and product are selected', () => {
      component.formState.update(s => ({
        ...s, isUnitValidated: true, isProductSelected: true
      }));
      component.loading.set(true);

      expect(component.canRetrieve()).toBeFalse();
    });
  });

  describe('canSave with saving state', () => {
    it('should be false when saving is true even if note has content', () => {
      component.noteText.set('Some text');
      component.saving.set(true);

      expect(component.canSave()).toBeFalse();
    });

    it('should be false when note is whitespace only', () => {
      component.noteText.set('   ');
      expect(component.canSave()).toBeFalse();
    });
  });

});
