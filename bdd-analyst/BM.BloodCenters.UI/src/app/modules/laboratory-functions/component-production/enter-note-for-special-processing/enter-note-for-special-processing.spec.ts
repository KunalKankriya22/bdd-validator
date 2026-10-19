import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { EnterNoteForSpecialProcessingComponent } from './enter-note-for-special-processing';
import { EnterNoteForSpecialProcessingService } from './services/enter-note-for-special-processing.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import type { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockSnackbarService, createMockPageHeaderService } from '@shared/testing/common-mocks';
import {
  SpecialProcessingApiResponse,
  SpecialProcessingNoteDto,
  ProductCodesResponse,
} from './models/enter-note-for-special-processing.model';

describe('EnterNoteForSpecialProcessingComponent', () => {
  let compiled: any;
  let call: any;
  let component: EnterNoteForSpecialProcessingComponent;
  let fixture: ComponentFixture<EnterNoteForSpecialProcessingComponent>;
  let mockService: jasmine.SpyObj<EnterNoteForSpecialProcessingService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W123412110201',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W123412110201',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  function simulateUnitValidated(unitId = 'W123412110201'): void {
    component.onUnitValidated({ ...mockUnitValidation, parsedUnitId: unitId });
  }

  function selectProcessCode(value: string): void {
    component.searchForm.patchValue({ processCode: value });
    component.onProcessCodeChange();
  }

  function selectProductCode(value: string): void {
    component.searchForm.get('productCode')!.setValue(value);
    component.onProductCodeChange();
  }

  const mockNoteResponse: SpecialProcessingApiResponse<SpecialProcessingNoteDto> = {
    success: true,
    message: 'Successfully retrieved component and note',
    statusCode: 200,
    item: {
      processCode: 'FROZ',
      processDescription: 'Freezing',
      unitId: 'W123412110201',
      collectionDate: '2012-11-02T00:00:00',
      chapterId: 'DAL',
      productCode: 'E0385V00',
      productDescription: 'RED BLOOD CELLS|AS5/450mL/refg...',
      componentPrefix: '00',
      aliquot: '00',
      noteId: 15406,
      noteText: 'Washed Red Cell for Special Patient Needs',
    },
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('EnterNoteForSpecialProcessingService', [
      'getProcessCodes',
      'getProductCodes',
      'getAliquots',
      'retrieve',
      'save',
    ]);
    mockSnackbar = createMockSnackbarService();
    mockPageHeaderService = createMockPageHeaderService();
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      value: signal({ title: 'Enter Note for Special Processing', subtitle: 'Enter note for special processing' }),
      writable: false,
    });

    chapterChangedSubject = new Subject<void>();

    mockPageHeaderService.getTitle.and.returnValue('Enter Note for Special Processing');
    mockPageHeaderService.getSubtitle.and.returnValue('Enter note for special processing');

    mockService.getProcessCodes.and.returnValue(of([
      { processCode: 'FROZ', description: 'Freezing' },
      { processCode: 'WASH', description: 'Washing' },
    ]));
    const mockProductCodesResponse: ProductCodesResponse = {
      success: true,
      message: 'Successfully retrieved product codes',
      statusCode: 200,
      item: { productCode: '', description: null, collectionDate: '2012-11-02T00:00:00' },
      data: [
        { productCode: 'E0385V00', description: 'RED BLOOD CELLS|AS5/450mL/refg...' },
      ],
      total: 1,
    };
    mockService.getProductCodes.and.returnValue(of(mockProductCodesResponse));
    mockService.getAliquots.and.returnValue(of([
      { aliquot: '00' },
      { aliquot: '01' },
    ]));
    mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [
        EnterNoteForSpecialProcessingComponent,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnterNoteForSpecialProcessingService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChangedSubject.asObservable() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    });


      mockPageHeaderService.getTitle.and.returnValue('Enter Note for Special Processing');


      mockPageHeaderService.getSubtitle.and.returnValue('Enter note for special processing');


      mockService.getProductCodes.and.returnValue(of(mockProductCodesResponse));


      mockPageHeaderService.getCurrentMenuItem.and.returnValue(undefined);


    fixture = TestBed.createComponent(EnterNoteForSpecialProcessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should load product codes when process code and unit ID are set', () => {
    component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
    component.selectedProcessCode.set('FROZ');
    simulateUnitValidated();
    expect(mockService.getProductCodes).toHaveBeenCalledWith('FROZ', 'W123412110201');
    expect(component.productCodes().length).toBe(1);
  });













  describe('retrieve', () => {
    beforeEach(() => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00' },
        { emitEvent: false }
      );
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
    });

    it('should call service and populate data from response.item', () => {
      component.onRetrieve();
      expect(mockService.retrieve).toHaveBeenCalled();
      expect(component.retrievedData()).toBeTruthy();
      expect(component.retrievedData()?.processCode).toBe('FROZ');
      expect(component.retrievedData()?.noteId).toBe(15406);
      expect(component.hasSearched()).toBeTrue();
    });

    it('should populate note form with retrieved note text', () => {
      component.onRetrieve();
      expect(component.noteForm.get('noteText')?.value).toBe('Washed Red Cell for Special Patient Needs');
    });

    it('should show computed descriptions after retrieve', () => {
      component.onRetrieve();
      expect(component.processDescription()).toBe('Freezing');
      expect(component.collectionDate()).toBe('02-NOV-2012');
      expect(component.productDescription()).toBe('RED BLOOD CELLS|AS5/450mL/refg...');
    });

    it('should pass product code directly to retrieve', () => {
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00', aliquot: '00' },
        { emitEvent: false }
      );
      component.onRetrieve();
      call = mockService.retrieve.calls.mostRecent();
      expect(call.args[0].productCode).toBe('E0385V00');
    });

    it('should set retrievedData to null on retrieve error', () => {
      mockService.retrieve.and.returnValue(throwError(() => new Error('fail')));
      component.onRetrieve();
      expect(component.retrievedData()).toBeNull();
      expect(component.loading()).toBeFalse();
    });
  });

  describe('notes section', () => {
    beforeEach(() => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00' },
        { emitEvent: false }
      );
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.onRetrieve();
      fixture.detectChanges();
    });

    it('should display notes section after retrieve', () => {
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.notes-section')).toBeTruthy();
    });

    it('should calculate characters remaining correctly', () => {
      component.noteForm.patchValue({ noteText: 'Hello' });
      expect(component.charactersRemaining).toBe(235);
    });

    it('should calculate 240 remaining for empty note', () => {
      component.noteForm.patchValue({ noteText: '' });
      expect(component.charactersRemaining).toBe(240);
    });
  });

  describe('save', () => {
    beforeEach(() => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00' },
        { emitEvent: false }
      );
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.onRetrieve();
    });

    it('should call save and show success snackbar', () => {
      mockService.save.and.returnValue(of({
        success: true,
        message: 'Note saved',
        statusCode: 200,
        item: mockNoteResponse.item,
      }));
      component.noteForm.patchValue({ noteText: 'Updated note' });

      component.onSave();

      expect(mockService.save).toHaveBeenCalledWith(jasmine.objectContaining({
        processCode: 'FROZ',
        noteText: 'Updated note',
        aliquot: '00',
      }));
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
        'Note for Special Processing for Process code - (FROZ) has been updated successfully.'
      );
    });





    it('should handle save error gracefully', () => {
      mockService.save.and.returnValue(throwError(() => new Error('fail')));
      component.onSave();
      expect(component.saving()).toBeFalse();
    });
  });

  describe('cancel', () => {
    it('should clear all forms and state', () => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00' },
        { emitEvent: false }
      );
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.onRetrieve();

      component.noteForm.patchValue({ noteText: 'Changed text' });
      component.onCancel();

      expect(component.retrievedData()).toBeNull();
      expect(component.noteForm.get('noteText')?.value).toBeNull();
      expect(component.selectedProcessCode()).toBe('');
      expect(component.selectedUnitId()).toBe('');
    });
  });

  describe('clear all', () => {
    it('should reset all forms and state', () => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.onRetrieve();

      component.onClearAll();

      expect(component.searchForm.get('processCode')?.value).toBeFalsy();
      expect(component.noteForm.get('noteText')?.value).toBeFalsy();
      expect(component.retrievedData()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
      expect(component.productCodes().length).toBe(0);
      expect(component.aliquots().length).toBe(0);
      expect(component.selectedUnitId()).toBe('');
      expect(component.selectedProcessCode()).toBe('');
      expect(component.selectedProductCode()).toBe('');
      expect(component.selectedAliquot()).toBe('');
      expect(component.collectionDateValue()).toBeNull();
    });
  });

  describe('collection date from product codes', () => {
    it('should show loading state while fetching collection date', () => {
      expect(component.loadingCollectionDate()).toBeFalse();
      const subject = new Subject<ProductCodesResponse>();
      mockService.getProductCodes.and.returnValue(subject.asObservable());

      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      expect(component.loadingCollectionDate()).toBeTrue();

      subject.next({
        success: true, message: '', statusCode: 200,
        item: { productCode: '', description: null, collectionDate: '2012-11-02T00:00:00' },
        data: [], total: 0,
      });
      expect(component.loadingCollectionDate()).toBeFalse();
    });

    it('should clear loading state on error', () => {
      mockService.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      expect(component.loadingCollectionDate()).toBeFalse();
    });






  });

  describe('reset rules', () => {


    it('should reset notes when product code changes', () => {
      mockService.retrieve.and.returnValue(of(mockNoteResponse));
      component.searchForm.patchValue(
        { processCode: 'FROZ', productCode: 'E0385V00' },
        { emitEvent: false }
      );
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.onRetrieve();
      expect(component.retrievedData()).toBeTruthy();

      selectProductCode('');
      expect(component.retrievedData()).toBeNull();
    });
  });

  describe('aliquots', () => {
    it('should load aliquots when process code, unit ID, and product code are set', () => {
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      selectProductCode('E0385V00');
      expect(mockService.getAliquots).toHaveBeenCalledWith('FROZ', 'W123412110201', 'E0385V00');
      expect(component.aliquots().length).toBe(2);
    });

    it('should auto-select aliquot when exactly one result is returned', () => {
      mockService.getAliquots.and.returnValue(of([{ aliquot: '00' }]));
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      selectProductCode('E0385V00');
      expect(component.searchForm.get('aliquot')?.value).toBe('00');
    });

    it('should not auto-select aliquot when multiple results are returned', () => {
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      selectProductCode('E0385V00');
      expect(component.searchForm.get('aliquot')?.value).toBeFalsy();
    });


  });

  describe('cascading disabled state', () => {








    it('should disable RETRIEVE when not all fields are filled', () => {
      expect(component.retrieveDisabled()).toBeTrue();
      component.selectedProcessCode.set('FROZ');
      expect(component.retrieveDisabled()).toBeTrue();
    });

    it('should enable RETRIEVE when all fields are filled', () => {
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.selectedAliquot.set('00');
      expect(component.retrieveDisabled()).toBeFalse();
    });

    it('should set selectedAliquot on auto-select', () => {
      mockService.getAliquots.and.returnValue(of([{ aliquot: '00' }]));
      component.searchForm.patchValue({ processCode: 'FROZ' }, { emitEvent: false });
      component.selectedProcessCode.set('FROZ');
      simulateUnitValidated();
      selectProductCode('E0385V00');
      expect(component.selectedAliquot()).toBe('00');
    });
  });

  describe('chapter change', () => {
    it('should clear all and reload process codes when chapter changes', () => {
      component.selectedProcessCode.set('FROZ');
      component.selectedUnitId.set('W123412110201');
      component.selectedProductCode.set('E0385V00');
      component.selectedAliquot.set('00');
      component.retrievedData.set(mockNoteResponse.item!);
      mockService.getProcessCodes.calls.reset();
      chapterChangedSubject.next();

      expect(component.selectedProcessCode()).toBe('');
      expect(component.selectedUnitId()).toBe('');
      expect(component.selectedProductCode()).toBe('');
      expect(component.selectedAliquot()).toBe('');
      expect(component.retrievedData()).toBeNull();
      expect(mockService.getProcessCodes).toHaveBeenCalledTimes(1);
    });
  });

  describe('page header', () => {


    it('should use menu item label when available', () => {
      mockPageHeaderService.getCurrentMenuItem.and.returnValue({ label: 'Custom Title' } as any);

      component.ngOnInit();

      expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Custom Title');
    });
  });
});
